"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { customOrderInputSchema, type Locale } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toCustomOrderInput, type CustomOrderDraft } from "../../lib/custom-order-draft";
import { sendCustomOrder } from "./custom-order-form.action";

type Options = {
  locale: string;
  initial: CustomOrderDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
};

export function useCustomOrderForm({ locale, initial, messages, errorLabels, invalidMessage }: Options) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState<{ number: string }> | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = customOrderInputSchema.safeParse(toCustomOrderInput(draft, locale as Locale), { reportInput: true });
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft, locale]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    sentNumber: result?.ok ? result.data.number : null,
    set: <K extends keyof CustomOrderDraft>(field: K, value: CustomOrderDraft[K]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setServerErrors({});
    },
    error: (path: string) => {
      const code = errors[path]?.[0];
      return code ? (errorLabels[code] ?? errorLabels.INVALID) : undefined;
    },
    reset: () => {
      setDraft(initial);
      setSubmitted(false);
      setResult(null);
    },
    submit: (event: FormEvent) => {
      event.preventDefault();
      setSubmitted(true);
      if (Object.keys(clientErrors).length > 0) {
        toast.error(invalidMessage);
        return focusFirstError();
      }

      startTransition(async () => {
        const outcome = await sendCustomOrder(locale, toCustomOrderInput(draft, locale as Locale));
        setResult(outcome);
        if (!outcome.ok) {
          setServerErrors(outcome.fieldErrors ?? {});
          if (outcome.fieldErrors) focusFirstError();
        }
      });
    },
  };
}
