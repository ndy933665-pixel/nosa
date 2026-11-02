"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { changePasswordSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { changeMyPassword } from "./change-password-form.action";

const EMPTY = { currentPassword: "", newPassword: "", confirm: "" };

type Options = { messages: FeedbackMessages; errorLabels: Record<string, string>; invalidMessage: string };

export function useChangePasswordForm({ messages, errorLabels, invalidMessage }: Options) {
  const [draft, setDraft] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const { confirm, ...input } = draft;
    const parsed = changePasswordSchema.safeParse(input);
    const errors: Record<string, string[]> = parsed.success ? {} : zodFieldErrors(parsed.error);
    if (!errors.newPassword && input.newPassword === input.currentPassword) errors.newPassword = ["SAME"];
    if (confirm !== input.newPassword) errors.confirm = ["MISMATCH"];
    return errors;
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    set: (field: keyof typeof EMPTY) => (value: string) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setServerErrors({});
    },
    error: (field: string) => {
      const code = errors[field]?.[0];
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
        const outcome = await changeMyPassword({ currentPassword: draft.currentPassword, newPassword: draft.newPassword });
        setResult(outcome);
        if (outcome.ok) {
          setDraft(EMPTY);
          setSubmitted(false);
        } else setServerErrors(outcome.fieldErrors ?? {});
      });
    },
  };
}
