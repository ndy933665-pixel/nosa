import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@nosa/contracts";

export const LOCALE_COOKIE = "nosa_locale";

function detectLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;

  // The browser language is ignored on purpose: the site opens in Arabic until the visitor picks English.
  return DEFAULT_LOCALE;
}

export const pathLocale = (request: NextRequest) => {
  const segment = request.nextUrl.pathname.split("/")[1] ?? "";
  return isLocale(segment) ? segment : null;
};

/** Redirects locale-less paths to /{locale}/...; returns null when the path already has one. */
export function localeRedirect(request: NextRequest) {
  if (pathLocale(request)) return null;
  const url = request.nextUrl.clone();
  url.pathname = `/${detectLocale(request)}${request.nextUrl.pathname}`;
  return NextResponse.redirect(url);
}

/** Remembers the visitor's language choice for their next visit. */
export function rememberLocale(request: NextRequest, response: NextResponse) {
  const locale = pathLocale(request);
  if (locale && request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
}
