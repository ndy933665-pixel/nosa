import "server-only";
import { CUSTOM_ORDER_STATUSES, type CustomOrderStatus } from "@nosa/contracts";
import { getAccessToken } from "@/shared/lib/auth";
import { customOrdersDashboardApi } from "../../api/custom-orders.api";

export const CUSTOM_ORDERS_PAGE_SIZE = 20;

/** Bad or missing URL params fall back to the defaults instead of breaking the page. */
export function parseCustomOrdersQuery(params: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const status = CUSTOM_ORDER_STATUSES.find((item) => item === first(params.status)) as CustomOrderStatus | undefined;
  const page = Math.max(1, Math.floor(Number(first(params.page))) || 1);
  return { status, page };
}

/** Request-time read: the owner must see a new request the moment it arrives. */
export async function listDashboardCustomOrders(query: ReturnType<typeof parseCustomOrdersQuery>) {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  const result = await customOrdersDashboardApi.list(token, { page: query.page, limit: CUSTOM_ORDERS_PAGE_SIZE, status: query.status });
  const meta = result.meta ?? { page: 1, limit: CUSTOM_ORDERS_PAGE_SIZE, total: result.data.length, pages: 1 };
  return { items: result.data, meta };
}
