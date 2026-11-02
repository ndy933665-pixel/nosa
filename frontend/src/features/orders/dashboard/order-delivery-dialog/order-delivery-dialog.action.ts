"use server";

import { refresh } from "next/cache";
import { orderDeliverySchema } from "@nosa/contracts";
import { actionFailure, actionSuccess, zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { ordersDashboardApi } from "../../api/orders.api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Confirms a reservation with where it goes (required) and its shipping company / tracking number (optional),
 * or, for an order that is already confirmed, just saves the edited delivery details.
 */
export async function saveOrderDelivery(id: string, mode: "confirm" | "edit", input: unknown, note?: string): Promise<ActionState> {
  if (!OBJECT_ID.test(id)) return actionFailure("VALIDATION_ERROR");
  const parsed = orderDeliverySchema.safeParse(input, { reportInput: true });
  if (!parsed.success) return actionFailure("VALIDATION_ERROR", zodFieldErrors(parsed.error));
  try {
    const token = await getAccessToken();
    if (!token) return actionFailure("UNAUTHORIZED");
    if (mode === "confirm") {
      await ordersDashboardApi.setStatus(token, id, { status: "confirmed", note: note?.trim().slice(0, 500) || undefined, delivery: parsed.data });
    } else {
      await ordersDashboardApi.setDelivery(token, id, parsed.data);
    }
    refresh();
    return actionSuccess("updated");
  } catch (error) {
    return toActionFailure(error);
  }
}
