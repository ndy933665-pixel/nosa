"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { createStaffSchema, updateStaffSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toCreateInput, toUpdateInput, type StaffDraft } from "../../lib/staff-draft";
import { saveStaff } from "./staff-dialog.action";

type Options = {
  memberId: string | null;
  initial: StaffDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
  onSaved: () => void;
};

export function useStaffDialog({ memberId, initial, messages, errorLabels, invalidMessage, onSaved }: Options) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = memberId ? updateStaffSchema.safeParse(toUpdateInput(draft)) : createStaffSchema.safeParse(toCreateInput(draft));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft, memberId]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    update: (change: Partial<StaffDraft>) => {
      setDraft((current) => ({ ...current, ...change }));
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
        const outcome = await saveStaff(memberId, memberId ? toUpdateInput(draft) : toCreateInput(draft));
        setResult(outcome);
        if (outcome.ok) onSaved();
        else setServerErrors(outcome.fieldErrors ?? {});
      });
    },
  };
}
