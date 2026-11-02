"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import type { LocalizedText, PageDto } from "@nosa/contracts";
import { pageInputSchema } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { htmlToText, textToHtml } from "../../lib/page-text";
import { savePage } from "./page-dialog.action";

type Draft = { slug: string; title: LocalizedText; body: LocalizedText; isPublished: boolean };

const toInput = (draft: Draft) => ({
  slug: draft.slug,
  title: draft.title,
  body: { ar: textToHtml(draft.body.ar), en: textToHtml(draft.body.en) },
  isPublished: draft.isPublished,
});

type Options = {
  page: PageDto | null;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
  onSaved: () => void;
};

export function usePageDialog({ page, messages, errorLabels, invalidMessage, onSaved }: Options) {
  const [draft, setDraft] = useState<Draft>({
    slug: page?.slug ?? "",
    title: page?.title ?? { ar: "", en: "" },
    body: page ? { ar: htmlToText(page.body.ar), en: htmlToText(page.body.en) } : { ar: "", en: "" },
    isPublished: page?.isPublished ?? true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = pageInputSchema.safeParse(toInput(draft));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    draft,
    pending,
    update: (change: Partial<Draft>) => {
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
        const outcome = await savePage(!page, toInput(draft));
        setResult(outcome);
        if (outcome.ok) onSaved();
        else setServerErrors(outcome.fieldErrors ?? {});
      });
    },
  };
}
