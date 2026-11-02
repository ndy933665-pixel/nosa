"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import type { CouponDto, Locale } from "@nosa/contracts";
import type { DateFieldLabels } from "@/shared/components/date-field";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import type { FeedbackMessages } from "@/shared/hooks/use-action-feedback";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/shared/lib/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { CouponDialog } from "../coupon-dialog";
import { useCouponsTable } from "./coupons-table.ux";

type CouponsTableProps = {
  coupons: CouponDto[];
  locale: Locale;
  dateLabels: DateFieldLabels;
  labels: Dictionary["dashboard"]["coupons"];
  invalidMessage: string;
  messages: FeedbackMessages;
};

function describeValue(coupon: CouponDto, locale: Locale, labels: CouponsTableProps["labels"]) {
  if (coupon.type === "free_shipping") return labels.types.free_shipping;
  if (coupon.type === "percent") return `${formatNumber(coupon.value, locale)}%`;
  return formatPrice(coupon.value, locale);
}

export function CouponsTable({ coupons, locale, labels, invalidMessage, messages, dateLabels }: CouponsTableProps) {
  const table = useCouponsTable(messages);

  const addButton = (
    <Button size="lg" className="h-10 px-4" onClick={() => table.openDialog(null)}>
      <Plus />
      {labels.add}
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={labels.title} subtitle={labels.subtitle} action={addButton} />

      <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
        {coupons.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.columns.code}</TableHead>
                <TableHead>{labels.columns.discount}</TableHead>
                <TableHead className="hidden md:table-cell">{labels.columns.minimum}</TableHead>
                <TableHead className="hidden sm:table-cell">{labels.columns.used}</TableHead>
                <TableHead className="hidden lg:table-cell">{labels.columns.validity}</TableHead>
                <TableHead>{labels.columns.status}</TableHead>
                <TableHead className="text-end">{labels.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell dir="ltr" className="text-start font-mono font-medium">
                    {coupon.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{describeValue(coupon, locale, labels)}</Badge>
                  </TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{coupon.minSubtotal > 0 ? formatPrice(coupon.minSubtotal, locale) : "—"}</TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">
                    {formatNumber(coupon.usedCount, locale)}
                    {coupon.maxUses !== null && ` / ${formatNumber(coupon.maxUses, locale)}`}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                    {coupon.startsAt || coupon.endsAt
                      ? `${coupon.startsAt ? formatDate(coupon.startsAt, locale) : "…"} → ${coupon.endsAt ? formatDate(coupon.endsAt, locale) : "…"}`
                      : labels.noDates}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.isActive}
                        disabled={table.pending}
                        onCheckedChange={() => table.toggleActive(coupon)}
                        aria-label={coupon.isActive ? labels.active : labels.disabled}
                      />
                      <span className="text-sm text-muted-foreground">{coupon.isActive ? labels.active : labels.disabled}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" title={labels.form.titleEdit} aria-label={`${labels.form.titleEdit}: ${coupon.code}`} onClick={() => table.openDialog(coupon)}>
                        <Pencil />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-destructive" title={labels.delete.action} aria-label={`${labels.delete.action}: ${coupon.code}`}>
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{labels.delete.title.replace("{code}", coupon.code)}</AlertDialogTitle>
                            <AlertDialogDescription>{coupon.usedCount > 0 ? labels.delete.usedText : labels.delete.text}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{labels.delete.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => table.remove(coupon)}>{labels.delete.confirm}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState illustration="empty-cart" title={labels.empty} description={labels.emptyHint} action={addButton} />
        )}
      </div>

      <CouponDialog
        key={table.dialog.key}
        open={table.dialog.open}
        onOpenChange={table.setDialogOpen}
        coupon={table.dialog.coupon}
        labels={labels}
        locale={locale}
        dateLabels={dateLabels}
        invalidMessage={invalidMessage}
        messages={messages}
      />
    </div>
  );
}
