"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { customOrderQuoteSchema } from "@nosa/contracts";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { ActionState } from "@/shared/lib/action-state";
import { sendCustomOrderQuote } from "./custom-order-quote.action";

type Initial = { price?: number; productionDays?: number; message?: string };

export function useCustomOrderQuote(orderId: string, initial: Initial, messages: FeedbackMessages, invalidMessage: string) {
  const [price, setPrice] = useState(initial.price?.toString() ?? "");
  const [days, setDays] = useState(initial.productionDays?.toString() ?? "");
  const [message, setMessage] = useState(initial.message ?? "");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  useActionFeedback(result, messages);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = { price: Number(price), productionDays: Number(days), message: message.trim() || undefined };
    if (!customOrderQuoteSchema.safeParse(input).success) return void toast.error(invalidMessage);
    startTransition(async () => setResult(await sendCustomOrderQuote(orderId, input)));
  };

  return {
    price,
    days,
    message,
    pending,
    setPrice: (value: string) => setPrice(value.replace(/[^\d.]/g, "")),
    setDays: (value: string) => setDays(value.replace(/\D/g, "")),
    setMessage,
    submit,
  };
}
