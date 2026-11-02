"use client";

import { useState } from "react";
import { NAMED_COLORS } from "@/shared/lib/colors/named-colors";
import type { OptionValueDraft } from "../lib/product-draft";
import { slugify } from "../lib/variants";

const DEFAULT_HEX = "#832f88";

export function useOptionValuesEditor(values: OptionValueDraft[], onChange: (values: OptionValueDraft[]) => void) {
  const [ar, setAr] = useState("");
  const [en, setEn] = useState("");
  const [hex, setHex] = useState(DEFAULT_HEX);

  const key = slugify(en) || slugify(ar);
  // Without Latin letters in either name we still need a stable key, so number it.
  const value = key || `v${values.length + 1}`;
  const canAdd = ar.trim() !== "" && en.trim() !== "" && !values.some((existing) => existing.value === value);

  return {
    ar,
    en,
    hex,
    setAr,
    setEn,
    setHex,
    canAdd,
    add: () => {
      if (!canAdd) return;
      onChange([...values, { value, label: { ar: ar.trim(), en: en.trim() }, hex }]);
      setAr("");
      setEn("");
    },
    remove: (target: string) => onChange(values.filter((existing) => existing.value !== target)),
    /** A named color is added with its Arabic/English names and swatch in one tap, or removed if it is already there. */
    togglePreset: (key: string) => {
      if (values.some((existing) => existing.value === key)) return onChange(values.filter((existing) => existing.value !== key));
      const color = NAMED_COLORS.find((item) => item.key === key);
      if (color) onChange([...values, { value: color.key, label: { ...color.name }, hex: color.hex }]);
    },
  };
}
