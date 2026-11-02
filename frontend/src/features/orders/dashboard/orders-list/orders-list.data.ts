import "server-only";
import { orderDashboardQuerySchema } from "@nosa/contracts";
import { getAccessToken } from "@/shared/lib/auth";
import { ordersDashboardApi } from "../../api/orders.api";

export const ORDERS_PAGE_SIZE = 20;

/** Bad or missing URL params fall back to the defaults instead of breaking the page. */
export function parseOrdersQuery(params: Record<string, string | string[] | undefined>) {
  const flat = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]));
  const parsed = orderDashboardQuerySchema.safeParse(flat);
  return parsed.success ? parsed.data : orderDashboardQuerySchema.parse({});
}

/** Request-time read: the owner must see new orders the moment they arrive. Counts for the tabs come in parallel. */
export async function listDashboardOrders(query: ReturnType<typeof parseOrdersQuery>, customerId?: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");

  const { page, status, group, paymentMethod, q } = query;
  const scope = customerId ? { user: customerId } : {};
  const [result, counts] = await Promise.all([
    ordersDashboardApi.list(token, { page, limit: ORDERS_PAGE_SIZE, status, group, paymentMethod, q, ...scope }),
    ordersDashboardApi.summary(token, scope),
  ]);
  const meta = result.meta ?? { page: 1, limit: ORDERS_PAGE_SIZE, total: result.data.length, pages: 1 };
  return { items: result.data, meta, counts: counts.data };
}
