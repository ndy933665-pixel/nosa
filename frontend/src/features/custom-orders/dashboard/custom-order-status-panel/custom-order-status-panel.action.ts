"use server";

import { refresh } from "next/cache";
import { customOrderStatusSchema } from "@nosa/contracts";
import { actionFailure, actionSuccess, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { customOrdersDashboardApi } from "../../api/custom-orders.api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Moves a request to its next status. Express enforces the allowed path. */
export async function changeCustomOrderStatus(id: string, input: unknown): Promise<ActionState> {
  const parsed = customOrderStatusSchema.safeParse(input);
  if (!OBJECT_ID.test(id) || !parsed.success) return actionFailure("VALIDATION_ERROR");
  try {
    const token = await getAccessToken();
    if (!token) return actionFailure("UNAUTHORIZED");
    await customOrdersDashboardApi.setStatus(token, id, parsed.data.status, parsed.data.note || undefined);
    refresh();
    return actionSuccess("updated");
  } catch (error) {
    return toActionFailure(error);
  }
}
