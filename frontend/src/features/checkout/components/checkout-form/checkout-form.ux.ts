"use client";

import { useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { checkoutSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toCheckoutInput, type CheckoutDraft } from "../../lib/checkout-draft";
import { placeOrder } from "./checkout-form.action";

type Options = {
  locale: string;
  initial: CheckoutDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
};

export function useCheckoutForm({ locale, initial, messages, errorLabels, invalidMessage }: Options) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  // One key per attempt: a double click or a retry returns the same order instead of creating another.
  const idempotencyKey = useRef<string | null>(null);
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = checkoutSchema.safeParse(toCheckoutInput(draft), { reportInput: true });
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    set: <K extends keyof CheckoutDraft>(field: K, value: CheckoutDraft[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setServerErrors({});
    },
    error: (path: string) => {
      const code = errors[path]?.[0];
      return code ? (errorLabels[code] ?? errorLabels.INVALID) : undefined;
    },
    submit: (event: FormEvent) => {
      event.preventDefault();
      setSubmitted(true);
      if (Object.keys(clientErrors).length > 0) {
        toast.error(invalidMessage);
        return focusFirstError();
      }

      idempotencyKey.current ??= crypto.randomUUID();
      startTransition(async () => {
        // On success the action redirects, so only failures come back.
        const outcome = await placeOrder(locale, idempotencyKey.current!, toCheckoutInput(draft));
        setResult(outcome);
        if (!outcome.ok) {
          setServerErrors(outcome.fieldErrors ?? {});
          if (outcome.fieldErrors) focusFirstError();
        }
      });
    },
  };
}
