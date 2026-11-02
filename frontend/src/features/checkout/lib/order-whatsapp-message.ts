import type { Locale, OrderDto } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatPrice } from "@/shared/lib/format";

/** The reservation as a WhatsApp message: every piece with its options and personalisation, totals and contact. */
export function orderWhatsappMessage(order: OrderDto, locale: Locale, dict: Dictionary) {
  const t = dict.store.order.whatsapp;
  const fill = (template: string, value: string) => template.replace("{value}", value);

  const items = order.items.map((item) => {
    const options = item.optionLabels.map((label) => label[locale]).join(" · ");
    const custom = Object.values(item.customization).join(" · ");
    const details = [options, custom].filter(Boolean).join(" | ");
    return `- ${item.quantity} × ${item.name[locale]}${details ? ` (${details})` : ""} = ${formatPrice(item.lineTotal, locale)}`;
  });

  return [
    t.intro.replace("{number}", order.number),
    "",
    t.items,
    ...items,
    "",
    order.discount > 0 ? fill(t.discount, formatPrice(order.discount, locale)) : null,
    fill(t.total, formatPrice(order.total, locale)),
    "",
    fill(t.name, order.contact.name),
    fill(t.phone, order.contact.phone),
    order.notes ? fill(t.notes, order.notes) : null,
    order.source ? fill(t.source, dict.store.checkout.sourceOptions[order.source]) : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
