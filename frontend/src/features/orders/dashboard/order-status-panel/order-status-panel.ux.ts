"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@nosa/contracts";
import { useActionFeedback, type FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { ActionState } from "@/shared/lib/action-state";
import { changeOrderStatus } from "./order-status-panel.action";

export function useOrderStatusPanel(orderId: string, messages: FeedbackMessages) {
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);
  useActionFeedback(result, messages);

  const moveTo = (next: OrderStatus) =>
    startTransition(async () => {
      const outcome = await changeOrderStatus(orderId, { status: next, note });
      setResult(outcome);
      if (outcome.ok) {
        setStatus("");
        setNote("");
      }
    });

  const apply = () => status && moveTo(status);

  return { status, setStatus, note, setNote, pending, apply, moveTo };
}
