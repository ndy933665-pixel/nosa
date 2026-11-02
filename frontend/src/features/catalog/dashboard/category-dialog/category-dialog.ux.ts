"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { categoryInputSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toCategoryInput, type CategoryDraft } from "../lib/category-draft";
import { saveCategory } from "./category-dialog.action";

type Options = {
  categoryId: string | null;
  initial: CategoryDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
  onSaved: () => void;
};

export function useCategoryDialog({ categoryId, initial, messages, errorLabels, invalidMessage, onSaved }: Options) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = categoryInputSchema.safeParse(toCategoryInput(draft));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    update: (change: (current: CategoryDraft) => CategoryDraft) => {
      setDraft(change);
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

      startTransition(async () => {
        const outcome = await saveCategory(categoryId, toCategoryInput(draft));
        setResult(outcome);
        if (outcome.ok) onSaved();
        else setServerErrors(outcome.fieldErrors ?? {});
      });
    },
  };
}
