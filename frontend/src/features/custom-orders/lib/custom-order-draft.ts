import type { CUSTOM_ORDER_TYPES, CustomOrderInput, ImageAsset, Locale } from "@nosa/contracts";
import { NAMED_COLORS } from "@/shared/lib/colors/named-colors";

/** What the custom order form holds while typing. */
export type CustomOrderDraft = {
  name: string;
  phone: string;
  type: (typeof CUSTOM_ORDER_TYPES)[number];
  description: string;
  sizes: string;
  /** Keys from NAMED_COLORS. */
  colors: string[];
  budget: string;
  neededBy: string;
  referenceImages: ImageAsset[];
};

export const emptyCustomOrderDraft = (prefill: Partial<Pick<CustomOrderDraft, "name" | "phone">> = {}): CustomOrderDraft => ({
  name: "",
  phone: "",
  type: "dress_set",
  description: "",
  sizes: "",
  colors: [],
  budget: "",
  neededBy: "",
  referenceImages: [],
  ...prefill,
});

/** Blank optional fields are left out, so the shared zod schema treats them as "not given". */
export function toCustomOrderInput(draft: CustomOrderDraft, locale: Locale): CustomOrderInput {
  const colorNames = NAMED_COLORS.filter((color) => draft.colors.includes(color.key)).map((color) => color.name[locale]);
  const optional = (value: string) => (value.trim() ? value.trim() : undefined);
  return {
    contact: { name: draft.name, phone: draft.phone },
    type: draft.type,
    description: draft.description,
    sizes: optional(draft.sizes),
    colors: colorNames.length ? colorNames.join("، ") : undefined,
    budget: optional(draft.budget) ? Number(draft.budget) : undefined,
    neededBy: optional(draft.neededBy) ? new Date(draft.neededBy) : undefined,
    referenceImages: draft.referenceImages,
  };
}
