import type { HomeSectionContent, Locale, LocalizedText } from "@nosa/contracts";
import type { IllustrationName } from "@/shared/components/illustration";
import type { Dictionary } from "@/shared/i18n/get-dictionary";

/** Hero and banner images are optional: until the owner uploads one, the shipped artwork shows instead. */
export type RenderableContent = HomeSectionContent;
/** `illustration` is the shipped artwork shown until the owner uploads a real image. */
export type RenderableSection = { id: string; content: RenderableContent; illustration?: IllustrationName };

type Dictionaries = Record<Locale, Dictionary>;

/** Picks the same text from both dictionaries, so every default is stored in Arabic and English. */
const pick = (dicts: Dictionaries, read: (dict: Dictionary) => string): LocalizedText => ({ ar: read(dicts.ar), en: read(dicts.en) });

/**
 * What the home page shows before the owner arranges it from the dashboard, and what "use the ready
 * design" copies into her editable list. Once she saves her own sections these are never used.
 */
export function defaultHomeSections(dicts: Dictionaries): RenderableSection[] {
  const text = (read: (defaults: Dictionary["home"]["defaults"]) => string) => pick(dicts, (dict) => read(dict.home.defaults));
  const steps = dicts.ar.home.defaults.customSteps.map((_, index) => pick(dicts, (dict) => dict.home.defaults.customSteps[index]));

  return [
    {
      id: "default-hero",
      content: {
        type: "hero",
        title: text((d) => d.heroTitle),
        subtitle: text((d) => d.heroSubtitle),
        primaryCta: { label: text((d) => d.shopNow), href: "/shop" },
        secondaryCta: { label: text((d) => d.customOrder), href: "/custom-order" },
      },
    },
    { id: "default-categories", content: { type: "categories", title: pick(dicts, (dict) => dict.home.shopByCategory), categorySlugs: [] } },
    { id: "default-bestsellers", content: { type: "products", title: pick(dicts, (dict) => dict.home.bestSellers), source: "bestsellers", limit: 4 } },
    {
      id: "default-about",
      illustration: "yarn-happy",
      content: {
        type: "richText",
        title: text((d) => d.aboutTitle),
        body: text((d) => d.aboutText),
        stats: [
          { value: "100%", label: text((d) => d.aboutStats.handmade) },
          { value: "500+", label: text((d) => d.aboutStats.customers) },
          { value: "4.9", label: text((d) => d.aboutStats.rating) },
        ],
        cta: { label: text((d) => d.aboutCta), href: "/pages/about" },
      },
    },
    {
      id: "default-embroidery",
      illustration: "yarn-basket",
      content: {
        type: "banner",
        title: text((d) => d.embroideryTitle),
        text: text((d) => d.embroideryText),
        cta: { label: text((d) => d.embroideryCta), href: "/shop" },
      },
    },
    {
      id: "default-custom",
      illustration: "yarn-ball",
      content: {
        type: "banner",
        title: text((d) => d.customTitle),
        text: text((d) => d.customText),
        steps,
        cta: { label: text((d) => d.customCta), href: "/custom-order" },
      },
    },
    { id: "default-newest", content: { type: "products", title: pick(dicts, (dict) => dict.home.newArrivals), source: "newest", limit: 4 } },
  ];
}
