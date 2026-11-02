"use server";

import { refresh } from "next/cache";
import { updateOrderStatusSchema } from "@nosa/contracts";
import { actionFailure, actionSuccess, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { ordersDashboardApi } from "../../api/orders.api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Moves an order to its next status. Express enforces the allowed path and puts stock back on cancel or return. */
export async function changeOrderStatus(id: string, input: unknown): Promise<ActionState> {
  const parsed = updateOrderStatusSchema.safeParse(input);
  if (!OBJECT_ID.test(id) || !parsed.success) return actionFailure("VALIDATION_ERROR");
  try {
    const token = await getAccessToken();
    if (!token) return actionFailure("UNAUTHORIZED");
    await ordersDashboardApi.setStatus(token, id, { status: parsed.data.status, note: parsed.data.note || undefined });
    refresh();
    return actionSuccess("updated");
  } catch (error) {
    return toActionFailure(error);
  }
}
