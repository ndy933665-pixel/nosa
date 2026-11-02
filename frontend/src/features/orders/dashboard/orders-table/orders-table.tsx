import Link from "next/link";
import type { DashboardOrderListItem, Locale } from "@nosa/contracts";
import { StatusBadge } from "@/shared/components/status-badge";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type OrdersTableProps = {
  items: DashboardOrderListItem[];
  locale: Locale;
  labels: Dictionary["dashboard"]["orders"];
  orderStatus: Dictionary["orderStatus"];
  sources: Dictionary["store"]["checkout"]["sourceOptions"];
  scopes: Dictionary["common"]["delivery"]["scopes"];
};

/** Newest first. The order number is the link to the detail page. */
export function OrdersTable({ items, locale, labels, orderStatus, sources, scopes }: OrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.columns.number}</TableHead>
          <TableHead>{labels.columns.customer}</TableHead>
          <TableHead className="hidden lg:table-cell">{labels.columns.source}</TableHead>
          <TableHead className="hidden sm:table-cell">{labels.columns.items}</TableHead>
          <TableHead>{labels.columns.total}</TableHead>
          <TableHead className="hidden md:table-cell">{labels.columns.payment}</TableHead>
          <TableHead>{labels.columns.status}</TableHead>
          <TableHead className="hidden md:table-cell">{labels.columns.delivery}</TableHead>
          <TableHead className="hidden xl:table-cell">{labels.columns.date}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link href={`/${locale}/dashboard/orders/${order.id}`} dir="ltr" className="font-medium text-primary hover:underline">
                {order.number}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{order.customer.name}</span>
                <span dir="ltr" className="text-start text-xs text-muted-foreground">
                  {order.customer.phone}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{order.source ? sources[order.source] : "—"}</TableCell>
            <TableCell className="hidden tabular-nums sm:table-cell">{formatNumber(order.itemCount, locale)}</TableCell>
            <TableCell className="font-medium tabular-nums">{formatPrice(order.total, locale)}</TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col items-start gap-1">
                <span className="text-sm">{labels.paymentMethod[order.paymentMethod]}</span>
                <Badge variant="secondary">{labels.paymentStatus[order.paymentStatus]}</Badge>
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={order.status} label={orderStatus[order.status]} />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {order.shipment ? (
                <div className="flex flex-col text-sm">
                  <span>{scopes[order.shipment.scope]}</span>
                  {order.shipment.trackingNumber && (
                    <span dir="ltr" className="text-start font-mono text-xs text-muted-foreground">
                      {order.shipment.trackingNumber}
                    </span>
                  )}
                </div>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">{formatDate(order.createdAt, locale)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
