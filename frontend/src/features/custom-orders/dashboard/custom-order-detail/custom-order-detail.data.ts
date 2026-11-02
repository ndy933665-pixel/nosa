import "server-only";
import { notFound } from "next/navigation";
import { HttpError } from "@/shared/lib/api/http";
import { getAccessToken } from "@/shared/lib/auth";
import { customOrdersDashboardApi } from "../../api/custom-orders.api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Request-time read of one request for the dashboard. A bad or unknown id is a 404 page. */
export async function getDashboardCustomOrder(id: string) {
  if (!OBJECT_ID.test(id)) notFound();
  const token = await getAccessToken();
  if (!token) throw new Error("UNAUTHORIZED");
  try {
    return (await customOrdersDashboardApi.detail(token, id)).data;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) notFound();
    throw error;
  }
}
