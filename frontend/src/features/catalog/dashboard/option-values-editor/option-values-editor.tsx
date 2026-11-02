"use client";

import { Plus, X } from "lucide-react";
import type { Locale } from "@nosa/contracts";
import { ColorSwatches } from "@/shared/components/color-swatches";
import { Button } from "@/shared/ui/button";
import { FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import type { OptionValueDraft } from "../lib/product-draft";
import { useOptionValuesEditor } from "./option-values-editor.ux";

type OptionValuesEditorProps = {
  title: string;
  kind: "size" | "color";
  values: OptionValueDraft[];
  onChange: (values: OptionValueDraft[]) => void;
  locale: Locale;
  labels: { valueAr: string; valueEn: string; add: string; remove: string; pickColors: string; customColor: string };
  example: { ar: string; en: string };
};

/** One option kind (sizes or colors): the chips added so far, and a row to add another. */
export function OptionValuesEditor({ title, kind, values, onChange, locale, labels, example }: OptionValuesEditorProps) {
  const editor = useOptionValuesEditor(values, onChange);

  return (
    <div className="flex flex-col gap-3">
      <FieldLabel>{title}</FieldLabel>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((option) => (
            <li key={option.value} className="flex items-center gap-2 rounded-full border bg-card py-1 ps-3 pe-1 text-sm">
              {kind === "color" && <span className="size-4 rounded-full border" style={{ backgroundColor: option.hex }} aria-hidden />}
              {option.label[locale]}
              <button
                type="button"
                onClick={() => editor.remove(option.value)}
                aria-label={`${labels.remove}: ${option.label[locale]}`}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {kind === "color" && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed p-3">
          <span className="text-sm text-muted-foreground">{labels.pickColors}</span>
          <ColorSwatches label={labels.pickColors} locale={locale} selected={values.map((option) => option.value)} onToggle={editor.togglePreset} />
        </div>
      )}
      {kind === "color" && <span className="text-sm text-muted-foreground">{labels.customColor}</span>}
      <div className="flex flex-wrap items-center gap-2">
        <Input className="w-36" lang="ar" dir="rtl" value={editor.ar} onChange={(event) => editor.setAr(event.target.value)} placeholder={`${labels.valueAr}: ${example.ar}`} aria-label={labels.valueAr} />
        <Input className="w-36" lang="en" dir="ltr" value={editor.en} onChange={(event) => editor.setEn(event.target.value)} placeholder={`${labels.valueEn}: ${example.en}`} aria-label={labels.valueEn} />
        {kind === "color" && (
          <input type="color" value={editor.hex} onChange={(event) => editor.setHex(event.target.value)} className="size-9 cursor-pointer rounded-full border bg-card p-0.5" aria-label={title} />
        )}
        <Button type="button" variant="outline" onClick={editor.add} disabled={!editor.canAdd}>
          <Plus />
          {labels.add}
        </Button>
      </div>
    </div>
  );
}
