"use client";

import { Globe, MapPin } from "lucide-react";
import { DELIVERY_SCOPES, type DeliveryScope } from "@nosa/contracts";
import { TextField } from "@/shared/components/text-field";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import type { DeliveryDraft } from "../../lib/delivery-draft";
import { useOrderDeliveryDialog } from "./order-delivery-dialog.ux";

type OrderDeliveryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  /** "confirm" also moves the reservation to confirmed; "edit" only saves the details. */
  mode: "confirm" | "edit";
  initial: DeliveryDraft;
  labels: Dictionary["dashboard"]["orders"]["delivery"];
  invalidMessage: string;
  messages: FeedbackMessages;
};

const SCOPE_ICONS: Record<DeliveryScope, typeof MapPin> = { domestic: MapPin, international: Globe };

/** Mounted fresh for every open (the parent renders it only while open), so it always starts from the saved values. */
export function OrderDeliveryDialog({ open, onOpenChange, orderId, mode, initial, labels, invalidMessage, messages }: OrderDeliveryDialogProps) {
  const form = useOrderDeliveryDialog({
    orderId,
    mode,
    initial,
    messages,
    errorLabels: labels.errors,
    invalidMessage,
    onSaved: () => onOpenChange(false),
  });
  const { draft, update, error } = form;
  const domestic = draft.scope === "domestic";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-primary-800">{mode === "confirm" ? labels.confirmTitle : labels.editTitle}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
          <Field>
            <FieldLabel>
              {labels.scope}
              <span className="text-destructive"> *</span>
            </FieldLabel>
            <div role="radiogroup" aria-label={labels.scope} className="grid grid-cols-2 gap-2">
              {DELIVERY_SCOPES.map((scope) => {
                const Icon = SCOPE_ICONS[scope];
                const active = draft.scope === scope;
                return (
                  <button
                    key={scope}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => update({ scope })}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
                      active ? "border-primary-600 bg-primary-50 text-primary-800" : "bg-card hover:border-primary-300",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {labels.scopes[scope]}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {domestic ? (
              <TextField label={labels.governorate} required placeholder={labels.governoratePlaceholder} value={draft.governorate} onValueChange={(governorate) => update({ governorate })} error={error("governorate")} />
            ) : (
              <TextField label={labels.country} required placeholder={labels.countryPlaceholder} value={draft.country} onValueChange={(country) => update({ country })} error={error("country")} />
            )}
            <TextField label={labels.city} required value={draft.city} onValueChange={(city) => update({ city })} error={error("city")} />
          </div>
          <TextField label={labels.street} required placeholder={labels.streetPlaceholder} value={draft.street} onValueChange={(street) => update({ street })} error={error("street")} />

          <div className="flex flex-col gap-4 rounded-xl border border-dashed p-3">
            <p className="text-sm text-muted-foreground">{labels.shippingHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={labels.carrier} placeholder={labels.carrierPlaceholder} value={draft.carrier} onValueChange={(carrier) => update({ carrier })} error={error("carrier")} />
              <TextField label={labels.trackingNumber} dir="ltr" autoComplete="off" value={draft.trackingNumber} onValueChange={(trackingNumber) => update({ trackingNumber })} error={error("trackingNumber")} />
            </div>
          </div>

          {mode === "confirm" && (
            <Field>
              <FieldLabel htmlFor="confirm-note">{labels.note}</FieldLabel>
              <Textarea id="confirm-note" rows={2} maxLength={500} value={form.note} onChange={(event) => form.setNote(event.target.value)} />
            </Field>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={form.pending}>
              {form.pending && <Spinner />}
              {mode === "confirm" ? labels.confirm : labels.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
