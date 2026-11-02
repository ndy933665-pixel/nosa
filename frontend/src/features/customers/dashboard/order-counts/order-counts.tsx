import { ORDER_STATUS_GROUPS, type Locale, type OrderStatusGroup } from "@nosa/contracts";
import { formatNumber } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

const tones: Record<OrderStatusGroup, string> = {
  pending: "bg-warning-50 text-warning",
  confirmed: "bg-success-50 text-success",
  cancelled: "bg-yarn-50 text-yarn-600",
};

type OrderCountsProps = {
  counts?: Record<OrderStatusGroup, number>;
  locale: Locale;
  labels: Record<OrderStatusGroup, string>;
};

/** A customer's orders at a glance: confirmed, waiting and cancelled, each in its own colour. */
export function OrderCounts({ counts, locale, labels }: OrderCountsProps) {
  const shown = ORDER_STATUS_GROUPS.filter((group) => (counts?.[group] ?? 0) > 0);
  if (!shown.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((group) => (
        <span key={group} title={labels[group]} className={cn("rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[group])}>
          {formatNumber(counts![group], locale)} {labels[group]}
        </span>
      ))}
    </div>
  );
}
