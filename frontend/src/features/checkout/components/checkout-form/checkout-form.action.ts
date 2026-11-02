"use server";

import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, checkoutSchema, isLocale, type OrderDto } from "@nosa/contracts";
import { loadDictionary } from "@/shared/i18n/get-dictionary";
import { actionFailure, zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toActionFailure } from "@/shared/lib/action-state/to-action-failure";
import { getAccessToken } from "@/shared/lib/auth";
import { clearCartCookie, getCartId } from "@/shared/lib/cart/cart-cookie";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";
import { whatsappLink } from "@/shared/lib/whatsapp";
import { checkoutApi } from "../../api/checkout.api";
import { rememberLastOrder } from "../../lib/last-order-cookie";
import { orderWhatsappMessage } from "../../lib/order-whatsapp-message";

const KEY = /^[\w-]{16,64}$/;

/**
 * Places the reservation from the cart. The idempotency key comes from the form, so a double click or a retry
 * after a slow network never creates two orders. Success goes straight to WhatsApp with the full order
 * (that is where payment and delivery are agreed), or to the thank-you page if no WhatsApp number is set.
 */
export async function placeOrder(localeValue: string, idempotencyKey: string, input: unknown): Promise<ActionState> {
  const locale = isLocale(localeValue) ? localeValue : DEFAULT_LOCALE;
  if (!KEY.test(idempotencyKey)) return actionFailure("VALIDATION_ERROR");

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION_ERROR", zodFieldErrors(parsed.error));

  let order: OrderDto;
  try {
    const [token, cartId] = await Promise.all([getAccessToken(), getCartId()]);
    ({ data: order } = await checkoutApi.placeOrder({ token: token ?? undefined, cartId }, parsed.data, idempotencyKey));
    await rememberLastOrder(order.number, parsed.data.contact.phone);
    await clearCartCookie();
  } catch (error) {
    return toActionFailure(error);
  }

  // Outside the try: redirect() works by throwing.
  const [settings, dict] = await Promise.all([getPublicSettings().catch(() => null), loadDictionary(locale)]);
  const whatsapp = settings?.contact.whatsapp;
  redirect(whatsapp ? whatsappLink(whatsapp, orderWhatsappMessage(order, locale, dict)) : `/${locale}/order/${order.number}`);
}
