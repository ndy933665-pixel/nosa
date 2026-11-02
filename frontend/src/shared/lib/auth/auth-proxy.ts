import { NextResponse, type NextRequest } from "next/server";
import type { AuthTokens } from "@nosa/contracts";
import { authApi } from "./auth.api";
import { loginPath } from "./login-path";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies, tokenExpiresWithin, writeSessionCookies } from "./cookies";

/** Refresh a minute before expiry so Server Components always see a valid access token. */
const REFRESH_MARGIN_SECONDS = 60;

const PROTECTED = [/^\/(ar|en)\/account(\/|$)/, /^\/(ar|en)\/dashboard(\/|$)/];

export type SessionRefresh = { tokens: AuthTokens | null; cleared: boolean };

/**
 * Server Components can't set cookies, so the proxy rotates the session before rendering:
 * the new tokens are written to the forwarded request (for this render) and to the response (browser).
 */
export async function refreshSession(request: NextRequest): Promise<SessionRefresh> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!refreshToken || !tokenExpiresWithin(accessToken, REFRESH_MARGIN_SECONDS)) {
    return { tokens: null, cleared: false };
  }

  try {
    const { data } = await authApi.refresh(refreshToken);
    request.cookies.set(ACCESS_COOKIE, data.tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE, data.tokens.refreshToken);
    return { tokens: data.tokens, cleared: false };
  } catch {
    request.cookies.delete(ACCESS_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
    return { tokens: null, cleared: true };
  }
}

export function applySessionRefresh(response: NextResponse, refresh: SessionRefresh) {
  if (refresh.tokens) writeSessionCookies(response.cookies, refresh.tokens);
  else if (refresh.cleared) clearSessionCookies(response.cookies);
}

/** Optimistic check only (no session → login page). Real checks run in the DAL and in Express. */
export function protectedRouteRedirect(request: NextRequest, locale: string) {
  const { pathname, search } = request.nextUrl;
  if (!PROTECTED.some((pattern) => pattern.test(pathname))) return null;
  if (request.cookies.get(REFRESH_COOKIE)?.value) return null;

  return NextResponse.redirect(new URL(loginPath(locale, pathname + search), request.url));
}
