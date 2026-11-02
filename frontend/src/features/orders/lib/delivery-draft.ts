import type { DeliveryScope, OrderDeliveryInput, OrderDto } from "@nosa/contracts";

/** The delivery form as typed: every field a string, empty when not filled. */
export type DeliveryDraft = {
  scope: DeliveryScope;
  country: string;
  governorate: string;
  city: string;
  street: string;
  carrier: string;
  trackingNumber: string;
};

/** Starts from what the order already has, so editing keeps the saved values. */
export function deliveryDraftFrom(order: Pick<OrderDto, "address" | "shipment">, locale: "ar" | "en"): DeliveryDraft {
  const address = order.address ?? {};
  return {
    scope: order.shipment?.scope ?? (address.country ? "international" : "domestic"),
    country: address.country ?? "",
    governorate: address.governorateName?.[locale] ?? address.governorate ?? "",
    city: address.city ?? "",
    street: [address.street, address.building, address.landmark].filter(Boolean).join("، "),
    carrier: order.shipment?.carrier ?? "",
    trackingNumber: order.shipment?.trackingNumber ?? "",
  };
}

const optional = (value: string) => value.trim() || undefined;

/** Only the place fields of the chosen scope are sent; the optional ones are dropped when empty. */
export function toDeliveryInput(draft: DeliveryDraft): OrderDeliveryInput {
  const domestic = draft.scope === "domestic";
  return {
    scope: draft.scope,
    country: domestic ? undefined : optional(draft.country),
    governorate: domestic ? optional(draft.governorate) : undefined,
    city: draft.city,
    street: draft.street,
    carrier: optional(draft.carrier),
    trackingNumber: optional(draft.trackingNumber),
  };
}
