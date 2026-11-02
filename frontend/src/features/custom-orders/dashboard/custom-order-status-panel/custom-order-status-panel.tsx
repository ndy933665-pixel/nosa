"use client";

import type { CustomOrderStatus } from "@nosa/contracts";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import { useCustomOrderStatusPanel } from "./custom-order-status-panel.ux";

type CustomOrderStatusPanelProps = {
  orderId: string;
  allowed: CustomOrderStatus[];
  labels: Dictionary["dashboard"]["customOrdersScreen"]["detail"]["status"];
  statusNames: Dictionary["dashboard"]["customOrdersScreen"]["status"];
  messages: FeedbackMessages;
};

/** Only the statuses the request may move to next are offered; Express checks the same rule. */
export function CustomOrderStatusPanel({ orderId, allowed, labels, statusNames, messages }: CustomOrderStatusPanelProps) {
  const panel = useCustomOrderStatusPanel(orderId, messages);

  if (!allowed.length) return <p className="text-sm text-muted-foreground">{labels.final}</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label>{labels.next}</Label>
        <Select value={panel.status} onValueChange={(value) => panel.setStatus(value as CustomOrderStatus)}>
          <SelectTrigger className="h-10 w-full bg-card">
            <SelectValue placeholder={labels.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {allowed.map((status) => (
              <SelectItem key={status} value={status}>
                {statusNames[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="custom-status-note">{labels.note}</Label>
        <Textarea id="custom-status-note" rows={2} maxLength={500} value={panel.note} onChange={(event) => panel.setNote(event.target.value)} />
      </div>
      <Button onClick={panel.apply} disabled={!panel.status || panel.pending}>
        {panel.pending && <Spinner />}
        {labels.apply}
      </Button>
    </div>
  );
}
