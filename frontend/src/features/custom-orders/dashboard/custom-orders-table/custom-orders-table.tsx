import Link from "next/link";
import type { CustomOrderDto, Locale } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { CustomOrderStatusBadge } from "../custom-order-status-badge";

type CustomOrdersTableProps = {
  items: CustomOrderDto[];
  locale: Locale;
  labels: Dictionary["dashboard"]["customOrdersScreen"];
  types: Dictionary["store"]["customOrder"]["types"];
};

/** Newest first. The request number is the link to the detail page. */
export function CustomOrdersTable({ items, locale, labels, types }: CustomOrdersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.columns.number}</TableHead>
          <TableHead>{labels.columns.customer}</TableHead>
          <TableHead className="hidden sm:table-cell">{labels.columns.type}</TableHead>
          <TableHead className="hidden md:table-cell">{labels.columns.budget}</TableHead>
          <TableHead>{labels.columns.status}</TableHead>
          <TableHead className="hidden lg:table-cell">{labels.columns.date}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link href={`/${locale}/dashboard/custom-orders/${order.id}`} dir="ltr" className="font-medium text-primary hover:underline">
                {order.number}
              </Link>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{order.contact.name}</span>
                <span dir="ltr" className="text-start text-xs text-muted-foreground">
                  {order.contact.phone}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{types[order.type]}</TableCell>
            <TableCell className="hidden tabular-nums md:table-cell">{order.budget ? formatPrice(order.budget, locale) : "—"}</TableCell>
            <TableCell>
              <CustomOrderStatusBadge status={order.status} label={labels.status[order.status]} />
            </TableCell>
            <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(order.createdAt, locale)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
