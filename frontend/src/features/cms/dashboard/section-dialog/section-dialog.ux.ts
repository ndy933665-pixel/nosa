"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { homeSectionContentSchema, type HomeSectionContent } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { saveSection } from "../home-manager/home-manager.action";

type Options = {
  sectionId: string | null;
  initial: HomeSectionContent;
  initialActive: boolean;
  messages: FeedbackMessages;
  errorLabels: Record<string, string>;
  invalidMessage: string;
  onSaved: () => void;
};

/** Optional buttons, steps and stats that were left empty are dropped before checking, so an untouched extra never blocks saving. */
function prune(content: HomeSectionContent): HomeSectionContent {
  const copy = { ...content } as Record<string, unknown>;
  if (Array.isArray(copy.steps) && copy.steps.length === 0) delete copy.steps;
  if (Array.isArray(copy.stats) && copy.stats.length === 0) delete copy.stats;
  for (const key of ["cta", "secondaryCta"]) if (copy[key] === undefined) delete copy[key];
  if (copy.image === undefined) delete copy.image;
  if (copy.subtitle && !(copy.subtitle as { ar: string; en: string }).ar && !(copy.subtitle as { ar: string; en: string }).en) delete copy.subtitle;
  if (copy.text && !(copy.text as { ar: string; en: string }).ar && !(copy.text as { ar: string; en: string }).en) delete copy.text;
  if (copy.type === "richText" && copy.title && !(copy.title as { ar: string; en: string }).ar && !(copy.title as { ar: string; en: string }).en) delete copy.title;
  return copy as HomeSectionContent;
}

export function useSectionDialog({ sectionId, initial, initialActive, messages, errorLabels, invalidMessage, onSaved }: Options) {
  const [content, setContent] = useState(initial);
  const [isActive, setIsActive] = useState(initialActive);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  const clientErrors = useMemo(() => {
    const parsed = homeSectionContentSchema.safeParse(prune(content));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [content]);
  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  return {
    content,
    isActive,
    setIsActive,
    pending,
    update: (next: HomeSectionContent) => {
      setContent(next);
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
        const outcome = await saveSection(sectionId, { content: prune(content), isActive });
        setResult(outcome);
        if (outcome.ok) onSaved();
        else setServerErrors(outcome.fieldErrors ?? {});
      });
    },
  };
}
