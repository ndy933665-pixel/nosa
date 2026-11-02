"use client";

import { Check } from "lucide-react";
import type { Locale } from "@nosa/contracts";
import { NAMED_COLORS } from "@/shared/lib/colors/named-colors";
import { cn } from "@/shared/lib/utils";

type ColorSwatchesProps = {
  /** Keys of the picked colors (see NAMED_COLORS). */
  selected: readonly string[];
  onToggle: (key: string) => void;
  locale: Locale;
  /** Accessible name of the whole group. */
  label: string;
  className?: string;
};

/** Every named color as a chip with its dot: tap to pick, tap again to remove. No typing, no color codes. */
export function ColorSwatches({ selected, onToggle, locale, label, className }: ColorSwatchesProps) {
  return (
    <div role="group" aria-label={label} className={cn("flex max-h-56 flex-wrap gap-2 overflow-y-auto p-0.5", className)}>
      {NAMED_COLORS.map((color) => {
        const active = selected.includes(color.key);
        return (
          <button
            key={color.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(color.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border bg-card py-1 ps-1 pe-3 text-sm transition-colors",
              active ? "border-primary-600 bg-primary-50 text-primary-800" : "hover:border-primary-300",
            )}
          >
            <span
              className="flex size-6 items-center justify-center rounded-full border border-black/10"
              // Swatch colors are data, the one place an inline color is allowed.
              style={{ backgroundColor: color.hex }}
              aria-hidden
            >
              {active && <Check className="size-3.5 text-white mix-blend-difference" />}
            </span>
            {color.name[locale]}
          </button>
        );
      })}
    </div>
  );
}
