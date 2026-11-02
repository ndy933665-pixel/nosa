"use client";

import { COUPON_TYPES, type CouponDto, type Locale } from "@nosa/contracts";
import { DateField, type DateFieldLabels } from "@/shared/components/date-field";
import { TextField } from "@/shared/components/text-field";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Switch } from "@/shared/ui/switch";
import { draftFromCoupon, emptyCouponDraft } from "../../lib/coupon-draft";
import { useCouponDialog } from "./coupon-dialog.ux";

type CouponDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The coupon being edited; null adds a new one. */
  coupon: CouponDto | null;
  labels: Dictionary["dashboard"]["coupons"];
  locale: Locale;
  dateLabels: DateFieldLabels;
  invalidMessage: string;
  messages: FeedbackMessages;
};

/** Mounted fresh for every open (the parent keys it), so the form always starts from the right values. */
export function CouponDialog({ open, onOpenChange, coupon, labels, locale, dateLabels, invalidMessage, messages }: CouponDialogProps) {
  const form = useCouponDialog({
    couponId: coupon?.id ?? null,
    initial: coupon ? draftFromCoupon(coupon) : emptyCouponDraft(),
    messages,
    errorLabels: labels.errors,
    invalidMessage,
    onSaved: () => onOpenChange(false),
  });
  const { draft, update, error } = form;
  const f = labels.form;
  const needsValue = draft.type !== "free_shipping";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary-800">{coupon ? f.titleEdit : f.titleNew}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
          <TextField
            label={f.code}
            required
            dir="ltr"
            autoComplete="off"
            placeholder="WELCOME10"
            value={draft.code}
            onValueChange={(code) => update({ code: code.toUpperCase() })}
            error={error("code")}
            hint={f.codeHint}
          />
          <Field>
            <FieldLabel>{f.type}</FieldLabel>
            <Select value={draft.type} onValueChange={(type) => update({ type: type as typeof draft.type })}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUPON_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {labels.types[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {needsValue && (
            <TextField
              label={draft.type === "percent" ? f.valuePercent : f.valueFixed}
              required
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={draft.value}
              onValueChange={(value) => update({ value })}
              error={error("value")}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={f.minSubtotal} type="number" min={0} step="any" inputMode="decimal" value={draft.minSubtotal} onValueChange={(minSubtotal) => update({ minSubtotal })} error={error("minSubtotal")} hint={f.minSubtotalHint} />
            <TextField label={f.maxUses} type="number" min={1} inputMode="numeric" value={draft.maxUses} onValueChange={(maxUses) => update({ maxUses })} error={error("maxUses")} hint={f.unlimitedHint} />
            <TextField label={f.perUserLimit} type="number" min={1} inputMode="numeric" value={draft.perUserLimit} onValueChange={(perUserLimit) => update({ perUserLimit })} error={error("perUserLimit")} hint={f.unlimitedHint} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField label={f.startsAt} locale={locale} labels={dateLabels} value={draft.startsAt} max={draft.endsAt || undefined} onValueChange={(startsAt) => update({ startsAt })} error={error("startsAt")} />
            <DateField label={f.endsAt} locale={locale} labels={dateLabels} value={draft.endsAt} min={draft.startsAt || undefined} onValueChange={(endsAt) => update({ endsAt })} error={error("endsAt")} />
          </div>
          <Field orientation="horizontal" className="items-center">
            <Switch id="coupon-active" checked={draft.isActive} onCheckedChange={(isActive) => update({ isActive })} />
            <FieldLabel htmlFor="coupon-active">{f.active}</FieldLabel>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {f.cancel}
            </Button>
            <Button type="submit" disabled={form.pending}>
              {form.pending && <Spinner />}
              {f.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
