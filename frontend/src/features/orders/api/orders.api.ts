import "server-only";
import type {
  DashboardOrderDto,
  DashboardOrderListItem,
  OrderDeliveryInput,
  OrderDto,
  OrderGroupCounts,
  OrderStatus,
  OrderStatusGroup,
} from "@nosa/contracts";
import { http } from "@/shared/lib/api/http";

type CustomerScope = { user?: string; phone?: string };

type ListQuery = CustomerScope & {
  page?: number;
  limit?: number;
  status?: string;
  group?: OrderStatusGroup;
  paymentMethod?: string;
  q?: string;
  from?: string;
  to?: string;
};

/** Dashboard order endpoints (every dashboard role; Express checks the token on each call). */
export const ordersDashboardApi = {
  list: (token: string, query: ListQuery) => http<DashboardOrderListItem[]>("/dashboard/orders", { token, query }),
  summary: (token: string, query: CustomerScope = {}) => http<OrderGroupCounts>("/dashboard/orders/summary", { token, query }),
  detail: (token: string, id: string) => http<DashboardOrderDto>(`/dashboard/orders/${id}`, { token }),
  setStatus: (token: string, id: string, body: { status: OrderStatus; note?: string; delivery?: OrderDeliveryInput }) =>
    http<DashboardOrderDto>(`/dashboard/orders/${id}/status`, { method: "PATCH", token, body }),
  setDelivery: (token: string, id: string, delivery: OrderDeliveryInput) =>
    http<DashboardOrderDto>(`/dashboard/orders/${id}/delivery`, { method: "PATCH", token, body: delivery }),
  addNote: (token: string, id: string, note: string) =>
    http<DashboardOrderDto>(`/dashboard/orders/${id}/notes`, { method: "POST", token, body: { note } }),
};

/** The signed-in customer's own orders (by account, or placed as a guest with the same phone). */
export const myOrdersApi = {
  list: (token: string) => http<OrderDto[]>("/orders/me", { token }),
};
