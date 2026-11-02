import "server-only";
import type { CustomerListItem, OrderGroupCounts, OrderStatusGroup } from "@nosa/contracts";
import { http } from "@/shared/lib/api/http";

export const customersDashboardApi = {
  list: (token: string, query: { page?: number; limit?: number; q?: string }) =>
    http<CustomerListItem[]>("/dashboard/users/customers", { token, query }),
  detail: (token: string, id: string) => http<CustomerListItem>(`/dashboard/users/customers/${id}`, { token }),
  /** Orders per group for a page of customers, keyed by phone (one aggregation on the API). */
  orderCounts: (token: string, phones: string[]) =>
    http<Record<string, Record<OrderStatusGroup, number>>>("/dashboard/orders/customer-counts", { token, query: { phones: phones.join(",") } }),
  /** One customer's order counts and what they spent (by account and by phone). */
  orderSummary: (token: string, user: string) => http<OrderGroupCounts>("/dashboard/orders/summary", { token, query: { user } }),
};
