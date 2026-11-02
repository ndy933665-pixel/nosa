import Link from "next/link";
import type { CustomerListItem, Locale } from "@nosa/contracts";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatDate } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { OrderCounts } from "../order-counts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

type CustomersTableProps = {
  items: CustomerListItem[];
  locale: Locale;
  labels: Dictionary["dashboard"]["customers"];
};

/** Newest customers first. The name opens the customer page (profile + all their orders). */
export function CustomersTable({ items, locale, labels }: CustomersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.columns.name}</TableHead>
          <TableHead>{labels.columns.phone}</TableHead>
          <TableHead className="hidden md:table-cell">{labels.columns.email}</TableHead>
          <TableHead className="hidden sm:table-cell">{labels.columns.joined}</TableHead>
          <TableHead className="hidden lg:table-cell">{labels.columns.lastLogin}</TableHead>
          <TableHead>{labels.columns.orders}</TableHead>
          <TableHead>{labels.columns.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <Link href={`/${locale}/dashboard/customers/${customer.id}`} className="font-medium text-primary hover:underline" title={labels.viewOrders}>
                {customer.name}
              </Link>
            </TableCell>
            <TableCell>
              <span dir="ltr" className="text-start">
                {customer.phone}
              </span>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">{customer.email}</TableCell>
            <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{formatDate(customer.createdAt, locale)}</TableCell>
            <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{customer.lastLoginAt ? formatDate(customer.lastLoginAt, locale) : "—"}</TableCell>
            <TableCell>
              <OrderCounts counts={customer.orders} locale={locale} labels={labels.orderGroups} />
            </TableCell>
            <TableCell>
              <Badge variant={customer.isActive ? "secondary" : "destructive"}>{customer.isActive ? labels.active : labels.disabled}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
