"use client";

import { TextField } from "@/shared/components/text-field";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import { useCustomOrderQuote } from "./custom-order-quote.ux";

type CustomOrderQuoteProps = {
  orderId: string;
  initial: { price?: number; productionDays?: number; message?: string };
  labels: Dictionary["dashboard"]["customOrdersScreen"]["detail"]["quote"];
  invalidMessage: string;
  messages: FeedbackMessages;
};

export function CustomOrderQuote({ orderId, initial, labels, invalidMessage, messages }: CustomOrderQuoteProps) {
  const form = useCustomOrderQuote(orderId, initial, messages, invalidMessage);

  return (
    <form onSubmit={form.submit} className="flex flex-col gap-3">
      <TextField label={labels.price} required dir="ltr" inputMode="decimal" value={form.price} onValueChange={form.setPrice} />
      <TextField label={labels.days} required dir="ltr" inputMode="numeric" value={form.days} onValueChange={form.setDays} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="quote-message">{labels.message}</Label>
        <Textarea id="quote-message" rows={3} maxLength={1000} value={form.message} onChange={(event) => form.setMessage(event.target.value)} />
      </div>
      <Button type="submit" disabled={form.pending}>
        {form.pending && <Spinner />}
        {initial.price ? labels.revise : labels.send}
      </Button>
    </form>
  );
}
