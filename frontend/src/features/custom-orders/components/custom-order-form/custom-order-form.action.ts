"use server";

import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, customOrderInputSchema, isLocale } from "@nosa/contracts";
import { loadDictionary } from "@/shared/i18n/get-dictionary";
import { actionFailure, actionSuccess, zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";
import { whatsappLink } from "@/shared/lib/whatsapp";
import { customOrdersApi } from "../../api/custom-orders.api";
import { customOrderWhatsappMessage } from "../../lib/custom-order-whatsapp-message";

/**
 * Saves the custom order request (so it shows in the dashboard), then opens WhatsApp with every detail she
 * filled in. Without a WhatsApp number in the settings, the form shows its own thank-you state instead.
 */
export async function sendCustomOrder(localeValue: string, input: unknown): Promise<ActionState<{ number: string }>> {
  const locale = isLocale(localeValue) ? localeValue : DEFAULT_LOCALE;
  const parsed = customOrderInputSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION_ERROR", zodFieldErrors(parsed.error));

  let number: string;
  try {
    const token = await getAccessToken();
    ({ data: { number } } = await customOrdersApi.create(token ?? undefined, parsed.data));
  } catch (error) {
    return toActionFailure(error);
  }

  const [settings, dict] = await Promise.all([getPublicSettings().catch(() => null), loadDictionary(locale)]);
  const whatsapp = settings?.contact.whatsapp;
  // Outside the try: redirect() works by throwing.
  if (whatsapp) redirect(whatsappLink(whatsapp, customOrderWhatsappMessage(number, parsed.data, locale, dict)));
  return actionSuccess("sent", { number });
}
