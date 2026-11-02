"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { orderDeliverySchema } from "@nosa/contracts";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { focusFirstError } from "@/shared/lib/utils";
import { toDeliveryInput, type DeliveryDraft } from "../../lib/delivery-draft";
import { saveOrderDelivery } from "./order-delivery-dialog.action";

type Options = {
  orderId: string;
  mode: "confirm" | "edit";
  initial: DeliveryDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
  onSaved: () => void;
};

export function useOrderDeliveryDialog({ orderId, mode, initial, messages, errorLabels, invalidMessage, onSaved }: Options) {
  const [draft, setDraft] = useState(initial);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = orderDeliverySchema.safeParse(toDeliveryInput(draft), { reportInput: true });
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    note,
    setNote,
    pending,
    update: (change: Partial<DeliveryDraft>) => {
      setDraft((current) => ({ ...current, ...change }));
      setServerErrors({});
    },
    error: (path: keyof DeliveryDraft) => {
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

      startTransition(async () => {
        const outcome = await saveOrderDelivery(orderId, mode, toDeliveryInput(draft), note);
        setResult(outcome);
        if (outcome.ok) onSaved();
        else {
          setServerErrors(outcome.fieldErrors ?? {});
          focusFirstError();
        }
      });
    },
  };
}
