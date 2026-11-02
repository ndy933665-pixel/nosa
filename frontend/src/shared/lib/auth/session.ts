import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import type { SessionUser, UserRole } from "@nosa/contracts";
import { authApi } from "./auth.api";
import { ACCESS_COOKIE } from "./cookies";
import { loginPath } from "./login-path";

/**
 * Data Access Layer for the signed-in user. Reads cookies, so call it only inside <Suspense>
 * (or in dynamic routes). Deduplicated per request with React cache().
 */
export const getAccessToken = cache(async () => (await cookies()).get(ACCESS_COOKIE)?.value ?? null);

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return (await authApi.me(token)).data;
  } catch {
    return null;
  }
});

/** Redirects to the login page (keeping where the visitor was going) when signed out. */
export async function requireUser(locale: string, next?: string) {
  const user = await getSession();
  if (!user) redirect(loginPath(locale, next));
  return user;
}

export async function requireRole(locale: string, roles: readonly UserRole[], next?: string) {
  const user = await requireUser(locale, next);
  if (!roles.includes(user.role)) forbidden();
  return user;
}

/** For Server Actions: the token to pass to http(), or null when signed out. */
export const requireToken = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  return token;
};
