"use client";

import { useState, useTransition } from "react";
import type { CustomOrderStatus } from "@nosa/contracts";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { ActionState } from "@/shared/lib/action-state";
import { changeCustomOrderStatus } from "./custom-order-status-panel.action";

export function useCustomOrderStatusPanel(orderId: string, messages: FeedbackMessages) {
  const [status, setStatus] = useState<CustomOrderStatus | "">("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  useActionFeedback(result, messages);

  const apply = () =>
    status &&
    startTransition(async () => {
      const outcome = await changeCustomOrderStatus(orderId, { status, note });
      setResult(outcome);
      if (outcome.ok) {
        setStatus("");
        setNote("");
      }
    });

  return { status, setStatus, note, setNote, pending, apply };
}
