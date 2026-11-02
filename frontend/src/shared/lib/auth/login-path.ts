/**
 * Customers sign in at /login; the dashboard has its own unlisted page (/nosa) that nothing in the store links to.
 * The target decides which one, so "?next=" keeps where the visitor was going.
 */
export function loginPath(locale: string, next?: string) {
  const page = next?.startsWith(`/${locale}/dashboard`) ? "nosa" : "login";
  return `/${locale}/${page}${next ? `?next=${encodeURIComponent(next)}` : ""}`;
}
