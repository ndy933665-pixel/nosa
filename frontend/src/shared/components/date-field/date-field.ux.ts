"use client";

import { useState } from "react";
import { arEG, enUS } from "react-day-picker/locale";
import type { Locale } from "@nosa/contracts";
import { formatDate } from "@/shared/lib/format";

/** "yyyy-mm-dd" ⇄ a local Date at midnight; never through UTC, so the day never shifts by one. */
const parse = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
};
const toValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

type Options = { value: string; onValueChange: (value: string) => void; locale: Locale; min?: string; max?: string };

export function useDateField({ value, onValueChange, locale, min, max }: Options) {
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const minDate = parse(min);
  const maxDate = parse(max);
  const year = new Date().getFullYear();
  const today = startOfToday();

  const pick = (date: Date | undefined) => {
    onValueChange(date ? toValue(date) : "");
    setOpen(false);
  };

  return {
    open,
    setOpen,
    selected,
    minDate,
    display: selected ? formatDate(selected, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : undefined,
    dayPickerLocale: locale === "ar" ? arEG : enUS,
    disabled: [...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])],
    // The month/year dropdowns cover anniversaries in the past and orders a few years ahead.
    startMonth: minDate ?? new Date(year - 80, 0),
    endMonth: maxDate ?? new Date(year + 5, 11),
    todayDisabled: Boolean((minDate && today < minDate) || (maxDate && today > maxDate)),
    select: pick,
    pickToday: () => pick(today),
    clear: () => pick(undefined),
  };
}

/** Today as "yyyy-mm-dd", for `min` on fields that only accept future dates. */
export const todayValue = () => toValue(startOfToday());
