import "server-only";
import { getAccessToken } from "@/shared/lib/auth";
import { customersDashboardApi } from "../../api/customers.api";

export const CUSTOMERS_PAGE_SIZE = 20;

/** Bad or missing URL params fall back to the first page with no search. */
export function parseCustomersQuery(params: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const page = Number(first(params.page));
  const q = first(params.q)?.trim().slice(0, 100);
  return { page: Number.isInteger(page) && page >= 1 ? page : 1, q: q || undefined };
}

export async function listCustomers(query: ReturnType<typeof parseCustomersQuery>) {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  const result = await customersDashboardApi.list(token, { ...query, limit: CUSTOMERS_PAGE_SIZE });
  const meta = result.meta ?? { page: 1, limit: CUSTOMERS_PAGE_SIZE, total: result.data.length, pages: 1 };
  // Their order counts in one call for the whole page; the table still renders if it fails.
  const counts = result.data.length
    ? await customersDashboardApi.orderCounts(token, result.data.map((customer) => customer.phone)).then(
        (response) => response.data,
        () => ({}) as Record<string, never>,
      )
    : {};
  const items = result.data.map((customer) => ({ ...customer, orders: counts[customer.phone] }));
  return { items, meta };
}
