"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { productInputSchema, type ProductStatus } from "@nosa/contracts";
import { focusFirstError } from "@/shared/lib/utils";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import { zodFieldErrors, type ActionState } from "@/shared/lib/action-state";
import { toProductInput, type ProductDraft } from "../lib/product-draft";
import { saveProduct } from "./product-form.action";

type Options = {
  productId: string | null;
  initial: ProductDraft;
  messages: FeedbackMessages;
  /** Translated per error code (REQUIRED, DUPLICATE_SKU...). */
  errorLabels: Record<string, string>;
  /** Shown when the form can't be sent because something is invalid. */
  invalidMessage: string;
  listHref: string;
};

export function useProductForm({ productId, initial, messages, errorLabels, invalidMessage, listHref }: Options) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<ActionState<{ id: string }> | null>(null);
  const [pending, startTransition] = useTransition();
  useActionFeedback(result, messages);

  // The same zod schema the API uses, so a mistake shows up the moment it is made (after the first save attempt).
  const clientErrors = useMemo(() => {
    const parsed = productInputSchema.safeParse(toProductInput(draft));
    return parsed.success ? {} : zodFieldErrors(parsed.error);
  }, [draft]);

  const errors = submitted ? { ...serverErrors, ...clientErrors } : {};

  const update = (change: (current: ProductDraft) => ProductDraft) => {
    setDraft(change);
    setServerErrors({});
  };

  /** Translated message for one field path ("name.ar", "variants.0.sku"), if it has an error. */
  const error = (path: string) => {
    const code = errors[path]?.[0];
    return code ? (errorLabels[code] ?? errorLabels.INVALID) : undefined;
  };

  const save = (status?: ProductStatus) => {
    setSubmitted(true);
    // The status only changes once the save succeeds, so a rejected "Publish" leaves the product a draft.
    const next = status ? { ...draft, status } : draft;

    const parsed = productInputSchema.safeParse(toProductInput(next));
    if (!parsed.success) {
      toast.error(invalidMessage);
      return focusFirstError();
    }

    startTransition(async () => {
      const outcome = await saveProduct(productId, toProductInput(next));
      setResult(outcome);
      if (!outcome.ok) return setServerErrors(outcome.fieldErrors ?? {});
      if (status) setDraft(next);
      // A new product moves to its own edit page, so the next save updates instead of creating again.
      if (!productId) router.replace(`${listHref}/${outcome.data.id}`);
    });
  };

  return { draft, update, error, save, pending, hasErrors: Object.keys(errors).length > 0 };
}

export type ProductFormApi = ReturnType<typeof useProductForm>;
