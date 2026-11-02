import type { CustomOrderInput, Locale } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { cloudinaryUrl } from "@/shared/lib/media/cloudinary-loader";

/** The custom request as a WhatsApp message: everything she filled in, with links to her inspiration photos. */
export function customOrderWhatsappMessage(number: string, input: CustomOrderInput, locale: Locale, dict: Dictionary) {
  const t = dict.store.customOrder.whatsapp;
  const fill = (template: string, value: string) => template.replace("{value}", value);
  const images = input.referenceImages ?? [];

  return [
    t.intro.replace("{number}", number),
    "",
    fill(t.type, dict.store.customOrder.types[input.type]),
    fill(t.description, input.description),
    input.sizes ? fill(t.sizes, input.sizes) : null,
    input.colors ? fill(t.colors, input.colors) : null,
    input.budget ? fill(t.budget, formatPrice(input.budget, locale)) : null,
    input.neededBy ? fill(t.neededBy, formatDate(input.neededBy as Date | string, locale)) : null,
    ...(images.length ? ["", t.images, ...images.map((image) => cloudinaryUrl(image.publicId, { width: 1080 }))] : []),
    "",
    fill(t.name, input.contact.name),
    fill(t.phone, input.contact.phone),
  ]
    .filter((line) => line !== null)
    .join("\n");
}
