import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/shared/lib/api/http";
import { getAccessToken } from "@/shared/lib/auth";
import { customersDashboardApi } from "../../api/customers.api";

/** Request-time read of the customer and their order numbers, in parallel. */
export async function getCustomerProfile(id: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  try {
    const [customer, summary] = await Promise.all([customersDashboardApi.detail(token, id), customersDashboardApi.orderSummary(token, id)]);
    return { customer: customer.data, summary: summary.data };
  } catch (error) {
    if (error instanceof HttpError && (error.status === 404 || error.code === "VALIDATION_ERROR")) notFound();
    throw error;
  }
}
