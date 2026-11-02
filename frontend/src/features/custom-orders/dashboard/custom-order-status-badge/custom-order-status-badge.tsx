import type { CustomOrderStatus } from "@nosa/contracts";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

const tones: Record<CustomOrderStatus, string> = {
  new: "bg-warning-50 text-warning",
  quoted: "bg-info-50 text-info",
  accepted: "bg-primary-100 text-primary-800",
  in_production: "bg-blush text-primary-700",
  delivered: "bg-success-50 text-success",
  rejected: "bg-yarn-50 text-yarn-600",
  cancelled: "bg-muted text-muted-foreground",
};

type CustomOrderStatusBadgeProps = {
  status: CustomOrderStatus;
  /** Already translated status name. */
  label: string;
  className?: string;
};

export function CustomOrderStatusBadge({ status, label, className }: CustomOrderStatusBadgeProps) {
  return <Badge className={cn("border-transparent", tones[status], className)}>{label}</Badge>;
}
