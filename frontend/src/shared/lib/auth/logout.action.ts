"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@nosa/contracts";
import { authApi } from "./auth.api";
import { REFRESH_COOKIE, clearSessionCookies } from "./cookies";
import { loginPath } from "./login-path";

/**
 * Revokes the refresh token on the API (best effort), clears the cookies and returns to the login page.
 * An optional "next" keeps where the visitor was going, e.g. switching from a customer account to the dashboard.
 */
export async function logout(formData: FormData) {
  const value = String(formData.get("locale") ?? "");
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  const next = String(formData.get("next") ?? "");

  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch (error) {
      // The cookies are cleared either way; the token expires on its own if the API is unreachable.
      console.error("Logout request failed", error);
    }
  }
  clearSessionCookies(store);
  const safeNext = next.startsWith(`/${locale}/`) && !next.startsWith("//") ? next : "";
  redirect(loginPath(locale, safeNext || undefined));
}
