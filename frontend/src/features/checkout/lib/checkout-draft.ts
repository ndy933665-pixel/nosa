import type { CheckoutInput, OrderSource } from "@nosa/contracts";

/** What the checkout (reservation) form holds while typing. */
export type CheckoutDraft = {
  name: string;
  phone: string;
  email: string;
  source: OrderSource | "";
  notes: string;
};

export const emptyCheckoutDraft = (prefill: Partial<Pick<CheckoutDraft, "name" | "phone" | "email">> = {}): CheckoutDraft => ({
  name: "",
  phone: "",
  email: "",
  source: "",
  notes: "",
  ...prefill,
});

/** Blank optional fields are left out, so the shared zod schema treats them as "not given". */
export function toCheckoutInput(draft: CheckoutDraft): CheckoutInput {
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    contact: { name: draft.name, phone: draft.phone, email: optional(draft.email) },
    source: draft.source || undefined,
    notes: optional(draft.notes),
  };
}
