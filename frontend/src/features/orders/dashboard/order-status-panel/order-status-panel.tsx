"use client";

import type { ComponentProps } from "react";
import { Check, X } from "lucide-react";
import type { OrderStatus } from "@nosa/contracts";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import { OrderDeliveryButton } from "../order-delivery-button";
import { useOrderStatusPanel } from "./order-status-panel.ux";

type OrderStatusPanelProps = {
  orderId: string;
  allowed: OrderStatus[];
  labels: Dictionary["dashboard"]["orders"]["detail"]["status"];
  orderStatus: Dictionary["orderStatus"];
  messages: FeedbackMessages;
  /** The confirmation form (where the order goes, shipping company, tracking number). */
  delivery: Pick<ComponentProps<typeof OrderDeliveryButton>, "initial" | "labels" | "invalidMessage" | "messages">;
};

/** Only the statuses the order may move to next are offered; Express checks the same rule. */
export function OrderStatusPanel({ orderId, allowed, labels, orderStatus, messages, delivery }: OrderStatusPanelProps) {
  const panel = useOrderStatusPanel(orderId, messages);
  // A new reservation: the owner talks to the customer on WhatsApp first, then confirms or cancels in one tap.
  const awaitingConfirmation = allowed.includes("confirmed");

  if (!allowed.length) return <p className="text-sm text-muted-foreground">{labels.final}</p>;

  return (
    <div className="flex flex-col gap-3">
      {awaitingConfirmation ? (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-primary-300 bg-primary-50 p-3">
          <p className="text-sm text-primary-800">{labels.confirmHint}</p>
          <div className="grid grid-cols-2 gap-2">
            <OrderDeliveryButton orderId={orderId} mode="confirm" {...delivery}>
              <Check />
              {labels.confirm}
            </OrderDeliveryButton>
            <Button variant="outline" className="text-destructive" onClick={() => panel.moveTo("cancelled")} disabled={panel.pending}>
              {panel.pending ? <Spinner /> : <X />}
              {labels.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label>{labels.next}</Label>
          <Select value={panel.status} onValueChange={(value) => panel.setStatus(value as OrderStatus)}>
            <SelectTrigger className="h-10 w-full bg-card">
              <SelectValue placeholder={labels.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowed.map((status) => (
                <SelectItem key={status} value={status}>
                  {orderStatus[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="status-note">{labels.note}</Label>
        <Textarea id="status-note" rows={2} maxLength={500} value={panel.note} onChange={(event) => panel.setNote(event.target.value)} />
      </div>
      {!awaitingConfirmation && (
        <Button onClick={panel.apply} disabled={!panel.status || panel.pending}>
          {panel.pending && <Spinner />}
          {labels.apply}
        </Button>
      )}
    </div>
  );
}
