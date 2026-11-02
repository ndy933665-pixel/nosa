"use client";

import { useId } from "react";
import { CalendarDays, X } from "lucide-react";
import type { Locale } from "@nosa/contracts";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { useDateField } from "./date-field.ux";

export type DateFieldLabels = { placeholder: string; today: string; clear: string };

type DateFieldProps = {
  label: string;
  /** "yyyy-mm-dd", or "" when empty — the same string a native date input uses. */
  value: string;
  onValueChange: (value: string) => void;
  locale: Locale;
  labels: DateFieldLabels;
  required?: boolean;
  /** Already translated error message; also marks the field invalid. */
  error?: string;
  hint?: string;
  /** Earliest / latest day that can be picked ("yyyy-mm-dd"). */
  min?: string;
  max?: string;
  className?: string;
};

/** The one date picker of the app: a field showing the date in words, opening a calendar in the visitor's language. */
export function DateField({ label, value, onValueChange, locale, labels, required, error, hint, min, max, className }: DateFieldProps) {
  const id = useId();
  const picker = useDateField({ value, onValueChange, locale, min, max });

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover open={picker.open} onOpenChange={picker.setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            // A combobox may carry aria-invalid, so the red border, the shake and focusFirstError() all work here too.
            role="combobox"
            aria-expanded={picker.open}
            aria-controls={`${id}-calendar`}
            aria-invalid={!!error || undefined}
            className={cn(
              "flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-start text-sm transition-colors outline-none",
              "hover:border-primary-300 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            )}
          >
            <CalendarDays className="size-4 shrink-0 text-primary-600" aria-hidden />
            <span className={cn("flex-1 truncate", !picker.selected && "text-muted-foreground")}>{picker.display ?? labels.placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent id={`${id}-calendar`} align="start" className="w-auto overflow-hidden rounded-2xl p-0">
          <Calendar
            mode="single"
            locale={picker.dayPickerLocale}
            dir={locale === "ar" ? "rtl" : "ltr"}
            selected={picker.selected}
            defaultMonth={picker.selected ?? picker.minDate}
            onSelect={picker.select}
            disabled={picker.disabled}
            captionLayout="dropdown"
            startMonth={picker.startMonth}
            endMonth={picker.endMonth}
            className="[--cell-size:--spacing(9)]"
          />
          <div className="flex items-center justify-between gap-2 border-t border-dashed px-3 py-2">
            <Button type="button" variant="ghost" size="sm" onClick={picker.pickToday} disabled={picker.todayDisabled}>
              {labels.today}
            </Button>
            {picker.selected && (
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={picker.clear}>
                <X aria-hidden />
                {labels.clear}
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {hint && !error && <FieldDescription>{hint}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
