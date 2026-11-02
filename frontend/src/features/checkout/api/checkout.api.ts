import "server-only";
import { CART_ID_HEADER, IDEMPOTENCY_HEADER, type CheckoutInput, type OrderDto } from "@nosa/contracts";
import { http } from "@/shared/lib/api/http";

export const checkoutApi = {
  placeOrder: (ctx: { token?: string; cartId?: string | null }, body: CheckoutInput, idempotencyKey: string) =>
    http<OrderDto>("/orders", {
      method: "POST",
      token: ctx.token,
      body,
      headers: { [IDEMPOTENCY_HEADER]: idempotencyKey, ...(ctx.cartId && { [CART_ID_HEADER]: ctx.cartId }) },
    }),

  track: (number: string, phone: string) => http<OrderDto>("/orders/track", { method: "POST", body: { number, phone } }),
};
