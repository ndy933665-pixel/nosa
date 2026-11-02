"use client";

import { MessageCircle } from "lucide-react";
import { ORDER_SOURCES, type CartLineDto, type Locale, type OrderSource } from "@nosa/contracts";
import { OrderSummary } from "@/shared/components/order-summary";
import { TextField } from "@/shared/components/text-field";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/shared/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import type { CheckoutDraft } from "../../lib/checkout-draft";
import { useCheckoutForm } from "./checkout-form.ux";

type CheckoutFormProps = {
  locale: Locale;
  initial: CheckoutDraft;
  lines: Pick<CartLineDto, "id" | "name" | "quantity" | "lineTotal">[];
  subtotal: number;
  discount: number;
  labels: Dictionary["store"]["checkout"];
  cartLabels: Dictionary["store"]["cart"];
  messages: FeedbackMessages;
};

export function CheckoutForm({ locale, initial, lines, subtotal, discount, labels, cartLabels, messages }: CheckoutFormProps) {
  const form = useCheckoutForm({ locale, initial, messages, errorLabels: labels.errors, invalidMessage: labels.invalid });
  const { draft, set, error } = form;

  return (
    <form onSubmit={form.submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-6">
        <section className="flex gap-3 rounded-2xl border bg-secondary/60 p-4 shadow-card">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary-600" aria-hidden />
          <div className="flex flex-col gap-1">
            <h2 className="font-medium text-primary-800">{labels.how}</h2>
            <p className="text-sm text-muted-foreground">{labels.howText}</p>
          </div>
        </section>

        <fieldset className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card">
          <legend className="sr-only">{labels.contact}</legend>
          <h2 className="font-display text-xl font-semibold text-primary-800">{labels.contact}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={labels.name} required autoComplete="name" value={draft.name} onValueChange={(value) => set("name", value)} error={error("contact.name")} />
            <TextField label={labels.phone} required dir="ltr" inputMode="tel" autoComplete="tel" placeholder="01012345678" value={draft.phone} onValueChange={(value) => set("phone", value)} error={error("contact.phone")} />
          </div>
          <TextField label={labels.email} dir="ltr" type="email" autoComplete="email" value={draft.email} onValueChange={(value) => set("email", value)} error={error("contact.email")} />
          <Field>
            <FieldLabel>{labels.source}</FieldLabel>
            <Select value={draft.source} onValueChange={(value) => set("source", value as OrderSource)}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue placeholder={labels.sourcePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {ORDER_SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {labels.sourceOptions[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </fieldset>

        <Field>
          <FieldLabel htmlFor="order-notes">{labels.notes}</FieldLabel>
          <Textarea id="order-notes" rows={3} maxLength={500} value={draft.notes} onChange={(event) => set("notes", event.target.value)} />
          {error("notes") && <FieldDescription>{error("notes")}</FieldDescription>}
        </Field>
      </div>

      <OrderSummary locale={locale} labels={{ ...cartLabels, summary: labels.summary }} subtotal={subtotal} discount={discount} shippingText={labels.shippingText}>
        <ul className="flex flex-col gap-1 border-t border-dashed pt-3 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="line-clamp-1">
                {line.quantity} × {line.name[locale]}
              </span>
            </li>
          ))}
        </ul>
        <Button type="submit" size="xl" className="w-full" disabled={form.pending}>
          {form.pending && <Spinner />}
          {labels.placeOrder}
        </Button>
      </OrderSummary>
    </form>
  );
}
