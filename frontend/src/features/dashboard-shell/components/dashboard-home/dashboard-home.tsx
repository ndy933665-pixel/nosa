import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getLocale } from "@/shared/i18n/get-dictionary";
import { getSession } from "@/shared/lib/auth";
import { loginPath } from "@/shared/lib/auth/login-path";
import { homePathFor, navItemsFor } from "../../lib/nav-items";

/**
 * The /dashboard index. Managers get the overview (passed in by the route, because features can't
 * import each other); everyone else lands on the first screen their role can use.
 */
export async function DashboardHome({ overview }: { overview: ReactNode }) {
  const [locale, user] = await Promise.all([getLocale(), getSession()]);
  if (!user) redirect(loginPath(locale, `/${locale}/dashboard`));

  const hasOverview = navItemsFor(user.role).some((item) => item.key === "overview");
  if (!hasOverview) redirect(`/${locale}/dashboard${homePathFor(user.role)}`);

  return overview;
}
