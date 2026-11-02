import type { LocalizedText } from "@nosa/contracts";

export type NamedColor = { key: string; name: LocalizedText; hex: string };

/**
 * Yarn and fabric colors with friendly names, so nobody has to type a color or its code.
 * The hex values are swatch data (shown as a dot next to the name), not UI colors.
 */
export const NAMED_COLORS: readonly NamedColor[] = [
  { key: "white", name: { ar: "أبيض", en: "White" }, hex: "#ffffff" },
  { key: "off-white", name: { ar: "أوف وايت", en: "Off-white" }, hex: "#f5f0e6" },
  { key: "cream", name: { ar: "كريمي", en: "Cream" }, hex: "#f3e5c8" },
  { key: "beige", name: { ar: "بيج", en: "Beige" }, hex: "#d9c3a5" },
  { key: "camel", name: { ar: "جملي", en: "Camel" }, hex: "#c19a6b" },
  { key: "brown", name: { ar: "بني", en: "Brown" }, hex: "#7b4b2a" },
  { key: "coffee", name: { ar: "بني غامق", en: "Dark brown" }, hex: "#4a2c1d" },
  { key: "black", name: { ar: "أسود", en: "Black" }, hex: "#1f1f1f" },
  { key: "charcoal", name: { ar: "رمادي غامق", en: "Charcoal" }, hex: "#4a4a4f" },
  { key: "grey", name: { ar: "رمادي", en: "Grey" }, hex: "#9e9ea3" },
  { key: "light-grey", name: { ar: "رمادي فاتح", en: "Light grey" }, hex: "#d6d6d9" },
  { key: "baby-pink", name: { ar: "بيبي بينك", en: "Baby pink" }, hex: "#f8c8d4" },
  { key: "pink", name: { ar: "بمبي", en: "Pink" }, hex: "#ec8fb1" },
  { key: "dusty-pink", name: { ar: "روز", en: "Dusty pink" }, hex: "#d4a0a7" },
  { key: "fuchsia", name: { ar: "فوشيا", en: "Fuchsia" }, hex: "#d63384" },
  { key: "red", name: { ar: "أحمر", en: "Red" }, hex: "#d32f2f" },
  { key: "burgundy", name: { ar: "نبيتي", en: "Burgundy" }, hex: "#7b1e34" },
  { key: "coral", name: { ar: "كورال", en: "Coral" }, hex: "#f2836b" },
  { key: "peach", name: { ar: "خوخي", en: "Peach" }, hex: "#f9c9a8" },
  { key: "orange", name: { ar: "برتقالي", en: "Orange" }, hex: "#f08c2e" },
  { key: "mustard", name: { ar: "مسطردة", en: "Mustard" }, hex: "#d4a72c" },
  { key: "yellow", name: { ar: "أصفر", en: "Yellow" }, hex: "#f7d84a" },
  { key: "lemon", name: { ar: "لموني", en: "Lemon" }, hex: "#fbf0a2" },
  { key: "mint", name: { ar: "منت", en: "Mint" }, hex: "#b8e3cf" },
  { key: "sage", name: { ar: "زيتي فاتح", en: "Sage" }, hex: "#a8b89a" },
  { key: "olive", name: { ar: "زيتي", en: "Olive" }, hex: "#6b7340" },
  { key: "green", name: { ar: "أخضر", en: "Green" }, hex: "#3f8f5a" },
  { key: "dark-green", name: { ar: "أخضر غامق", en: "Dark green" }, hex: "#1f4d35" },
  { key: "turquoise", name: { ar: "تركواز", en: "Turquoise" }, hex: "#3ab5b0" },
  { key: "baby-blue", name: { ar: "بيبي بلو", en: "Baby blue" }, hex: "#b9d9f2" },
  { key: "sky-blue", name: { ar: "لبني", en: "Sky blue" }, hex: "#7fb8e6" },
  { key: "blue", name: { ar: "أزرق", en: "Blue" }, hex: "#2f6fbf" },
  { key: "navy", name: { ar: "كحلي", en: "Navy" }, hex: "#1f2f57" },
  { key: "lilac", name: { ar: "ليلكي", en: "Lilac" }, hex: "#cdb6e3" },
  { key: "lavender", name: { ar: "لافندر", en: "Lavender" }, hex: "#b49cd6" },
  { key: "purple", name: { ar: "موف", en: "Purple" }, hex: "#832f88" },
  { key: "gold", name: { ar: "دهبي", en: "Gold" }, hex: "#c9a64a" },
  { key: "silver", name: { ar: "فضي", en: "Silver" }, hex: "#c0c0c5" },
];
