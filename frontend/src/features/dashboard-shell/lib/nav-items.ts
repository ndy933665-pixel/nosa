import type { UserRole } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";

export type NavKey = keyof Dictionary["dashboard"]["nav"];

export type NavItem = {
  key: NavKey;
  /** Path after /{locale}/dashboard ("" is the overview). */
  path: string;
  /** Icon name from lucide-react, resolved in the client nav leaf. */
  icon: "overview" | "orders" | "customOrders" | "products" | "categories" | "customers" | "coupons" | "reviews" | "stories" | "content" | "shipping" | "staff" | "settings";
  roles: readonly UserRole[];
  /** False until the screen exists; shown disabled with a "soon" badge instead of a dead link. */
  ready: boolean;
};

const editors = ["editor", "admin", "owner"] as const;
const managers = ["admin", "owner"] as const;
const everyone = ["staff", "editor", "admin", "owner"] as const;

/** Order and wording follow the dashboard design (09). Flip `ready` as each phase lands. */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: "overview", path: "", icon: "overview", roles: managers, ready: true },
  { key: "orders", path: "/orders", icon: "orders", roles: everyone, ready: true },
  { key: "customOrders", path: "/custom-orders", icon: "customOrders", roles: everyone, ready: true },
  { key: "products", path: "/products", icon: "products", roles: editors, ready: true },
  { key: "categories", path: "/categories", icon: "categories", roles: editors, ready: true },
  { key: "customers", path: "/customers", icon: "customers", roles: managers, ready: true },
  { key: "coupons", path: "/coupons", icon: "coupons", roles: managers, ready: true },
  { key: "reviews", path: "/reviews", icon: "reviews", roles: editors, ready: false },
  { key: "stories", path: "/stories", icon: "stories", roles: editors, ready: false },
  { key: "content", path: "/content", icon: "content", roles: editors, ready: true },
  { key: "shipping", path: "/shipping", icon: "shipping", roles: managers, ready: true },
  { key: "staff", path: "/staff", icon: "staff", roles: managers, ready: true },
  { key: "settings", path: "/settings", icon: "settings", roles: managers, ready: true },
];

export const navItemsFor = (role: UserRole) => NAV_ITEMS.filter((item) => item.roles.includes(role));

/** Where a signed-in staff member lands: the overview for managers, otherwise their first screen (or their account page until their screens exist). */
export const homePathFor = (role: UserRole) => navItemsFor(role).find((item) => item.ready)?.path ?? "/account";
