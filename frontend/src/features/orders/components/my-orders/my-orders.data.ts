import "server-only";
import { ORDER_STATUS_GROUPS, orderStatusGroup, type OrderStatusGroup } from "@nosa/contracts";
import { getAccessToken, requireUser } from "@/shared/lib/auth";
import { myOrdersApi } from "../../api/orders.api";

export const parseGroup = (value: unknown): OrderStatusGroup | undefined =>
  ORDER_STATUS_GROUPS.find((group) => group === value);

/** The signed-in customer's orders (at most the latest 100), with counts per group for the tabs. */
export async function getMyOrders(locale: string) {
  const user = await requireUser(locale, `/${locale}/account/orders`);
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  const { data: orders } = await myOrdersApi.list(token);

  const counts: Record<OrderStatusGroup | "all", number> = { all: orders.length, pending: 0, confirmed: 0, cancelled: 0 };
  for (const order of orders) counts[orderStatusGroup(order.status)] += 1;
  return { user, orders, counts };
}
