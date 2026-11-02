import { DASHBOARD_ROLES, type SessionUser, type UserRole } from "@nosa/contracts";
import { ApiError } from "@/shared/http/api-error";
import { buildMeta, toSkip } from "@/shared/http/pagination";
import { hashPassword } from "@/shared/services/password.service";
import { UserModel, type UserDocument } from "./users.model";
import type { CreateStaffInput, CustomersQuery, UpdateStaffInput } from "./users.validation";

export function toSessionUser(user: UserDocument): SessionUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone ?? undefined,
    email: user.email ?? undefined,
    avatar: user.avatar ?? undefined,
    role: user.role,
    providers: user.providers as SessionUser["providers"],
    ...(user.mustChangePassword && { mustChangePassword: true }),
  };
}

export async function getUserOrThrow(id: string) {
  const user = await UserModel.findById(id);
  if (!user || !user.isActive) throw ApiError.notFound("User");
  return user;
}

export async function getSessionUser(id: string) {
  return toSessionUser(await getUserOrThrow(id));
}

export async function listCustomers({ q, ...page }: CustomersQuery) {
  const filter = { role: "customer" as const, ...(q && { $text: { $search: q } }) };
  const [items, total] = await Promise.all([
    UserModel.find(filter)
      .select("name phone email avatar providers isActive lastLoginAt createdAt")
      .sort({ createdAt: -1 })
      .skip(toSkip(page))
      .limit(page.limit),
    UserModel.countDocuments(filter),
  ]);
  return { items: items.map((user) => user.toJSON()), meta: buildMeta(page, total) };
}

/** The phone of any account (active or not), or null; used to find a customer's guest orders. */
export async function getUserPhone(id: string) {
  const user = await UserModel.findById(id).select("phone");
  return user?.phone ?? null;
}

export async function getCustomer(id: string) {
  const user = await UserModel.findOne({ _id: id, role: "customer" }).select("name phone email avatar providers isActive lastLoginAt createdAt");
  if (!user) throw ApiError.notFound("User");
  return user.toJSON();
}

export async function listStaff() {
  const staff = await UserModel.find({ role: { $in: DASHBOARD_ROLES } })
    .select("name phone email role isActive mustChangePassword lastLoginAt createdAt")
    .sort({ createdAt: 1 });
  return staff.map((user) => user.toJSON());
}

/** Only an owner may create or promote another owner. */
function assertCanAssign(actorRole: UserRole, role: UserRole) {
  if (role === "owner" && actorRole !== "owner") throw ApiError.forbidden("Only the owner can assign the owner role");
}

export async function createStaff(input: CreateStaffInput, actorRole: UserRole) {
  assertCanAssign(actorRole, input.role);
  if (await UserModel.exists({ phone: input.phone })) {
    throw new ApiError("CONFLICT", "Phone already registered", { "body.phone": ["ALREADY_EXISTS"] });
  }
  const user = await UserModel.create({
    name: input.name,
    phone: input.phone,
    role: input.role,
    passwordHash: await hashPassword(input.password),
    providers: ["phone"],
    mustChangePassword: true,
  });
  return toSessionUser(user);
}

export async function updateStaff(id: string, input: UpdateStaffInput, actor: { id: string; role: UserRole }) {
  if (id === actor.id) throw ApiError.forbidden("You can't change your own role or status");
  const user = await UserModel.findById(id);
  if (!user || !DASHBOARD_ROLES.includes(user.role as (typeof DASHBOARD_ROLES)[number])) {
    throw ApiError.notFound("Staff member");
  }
  if (user.role === "owner" && actor.role !== "owner") throw ApiError.forbidden();
  if (input.role) {
    assertCanAssign(actor.role, input.role);
    user.role = input.role;
  }
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.password) {
    user.passwordHash = await hashPassword(input.password);
    user.mustChangePassword = true;
    if (!user.providers.includes("phone")) user.providers.push("phone");
  }
  await user.save();
  return toSessionUser(user);
}

export async function countNewCustomers(from: Date) {
  return UserModel.countDocuments({ role: "customer", createdAt: { $gte: from } });
}
