import "server-only";
import type { CustomOrderDto, CustomOrderInput, CustomOrderStatus } from "@nosa/contracts";
import { http } from "@/shared/lib/api/http";

export const customOrdersApi = {
  create: (token: string | undefined, body: CustomOrderInput) =>
    http<{ number: string }>("/custom-orders", { method: "POST", token, body }),
};

/** Dashboard endpoints (Express checks the token and role on every call). */
export const customOrdersDashboardApi = {
  list: (token: string, query: { page?: number; limit?: number; status?: string }) =>
    http<CustomOrderDto[]>("/dashboard/custom-orders", { token, query }),
  detail: (token: string, id: string) => http<CustomOrderDto>(`/dashboard/custom-orders/${id}`, { token }),
  quote: (token: string, id: string, body: { price: number; productionDays: number; message?: string }) =>
    http<CustomOrderDto>(`/dashboard/custom-orders/${id}/quote`, { method: "POST", token, body }),
  setStatus: (token: string, id: string, status: CustomOrderStatus, note?: string) =>
    http<CustomOrderDto>(`/dashboard/custom-orders/${id}/status`, { method: "PATCH", token, body: { status, note } }),
};
