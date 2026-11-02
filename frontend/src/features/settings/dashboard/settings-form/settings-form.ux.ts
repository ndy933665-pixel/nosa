"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { settingsInputSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toSettingsInput, type SettingsDraft } from "../lib/settings-draft";
import { saveSettings } from "./settings-form.action";

type Options = {
  initial: SettingsDraft;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
};

export function useSettingsForm({ initial, messages, errorLabels, invalidMessage }: Options) {
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = settingsInputSchema.safeParse(toSettingsInput(draft));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    update: (change: (current: SettingsDraft) => SettingsDraft) => {
      setDraft(change);
      setServerErrors({});
    },
    error: (path: string) => {
      const code = errors[path]?.[0];
      return code ? (errorLabels[code] ?? errorLabels.INVALID) : undefined;
    },
    save: () => {
      setSubmitted(true);
      if (Object.keys(clientErrors).length > 0) {
        toast.error(invalidMessage);
        return focusFirstError();
      }
      startTransition(async () => {
        const outcome = await saveSettings(toSettingsInput(draft));
        setResult(outcome);
        if (!outcome.ok) {
          setServerErrors(outcome.fieldErrors ?? {});
          if (outcome.fieldErrors) focusFirstError();
        }
      });
    },
  };
}
