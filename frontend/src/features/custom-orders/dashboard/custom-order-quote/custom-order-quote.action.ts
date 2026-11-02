"use server";

import { refresh } from "next/cache";
import { customOrderQuoteSchema } from "@nosa/contracts";
import { actionFailure, actionSuccess, zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { customOrdersDashboardApi } from "../../api/custom-orders.api";

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Sends (or revises) the price and production time the customer will see. */
export async function sendCustomOrderQuote(id: string, input: unknown): Promise<ActionState> {
  const parsed = customOrderQuoteSchema.safeParse(input);
  if (!OBJECT_ID.test(id)) return actionFailure("VALIDATION_ERROR");
  if (!parsed.success) return actionFailure("VALIDATION_ERROR", zodFieldErrors(parsed.error));
  try {
    const token = await getAccessToken();
    if (!token) return actionFailure("UNAUTHORIZED");
    await customOrdersDashboardApi.quote(token, id, parsed.data);
    refresh();
    return actionSuccess("sent");
  } catch (error) {
    return toActionFailure(error);
  }
}
