import { z } from "zod";
import { DASHBOARD_ROLES } from "./enums";
import { passwordSchema } from "./auth";
import { phoneSchema } from "./phone";

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "TOO_SHORT").max(80, "TOO_LONG"),
  phone: phoneSchema,
  password: passwordSchema,
  role: z.enum(DASHBOARD_ROLES),
});

/** `password` sets a temporary one: the member must change it at their next sign-in. */
export const updateStaffSchema = z
  .object({ role: z.enum(DASHBOARD_ROLES), isActive: z.boolean(), password: passwordSchema })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "EMPTY_UPDATE");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "REQUIRED").max(128),
  newPassword: passwordSchema,
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type StaffMemberDto = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: (typeof DASHBOARD_ROLES)[number];
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
};

/** One row of the dashboard customers table. */
export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  providers?: string[];
  lastLoginAt?: string;
  createdAt: string;
  /** Orders per group, matched by account or phone. */
  orders?: { pending: number; confirmed: number; cancelled: number };
};
