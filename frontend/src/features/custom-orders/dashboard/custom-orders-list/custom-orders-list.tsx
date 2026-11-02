import Link from "next/link";
import { connection } from "next/server";
import { CUSTOM_ORDER_STATUSES } from "@nosa/contracts";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { Pager } from "@/shared/components/pager";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { formatNumber } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { CustomOrdersTable } from "../custom-orders-table";
import { listDashboardCustomOrders, parseCustomOrdersQuery } from "./custom-orders-list.data";

type CustomOrdersListProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function CustomOrdersList({ searchParams }: CustomOrdersListProps) {
  await connection();
  const [locale, dict, params] = await Promise.all([getLocale(), getDictionary(), searchParams]);
  const query = parseCustomOrdersQuery(params);
  const { items, meta } = await listDashboardCustomOrders(query);
  const t = dict.dashboard.customOrdersScreen;
  const pagination = dict.dashboard.orders.pagination;
  const base = `/${locale}/dashboard/custom-orders`;

  const hrefFor = (page: number, status = query.status) => {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (page > 1) next.set("page", String(page));
    const search = next.toString();
    return search ? `${base}?${search}` : base;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
        <nav className="flex flex-wrap gap-2" aria-label={t.columns.status}>
          <Button asChild size="sm" variant={query.status ? "outline" : "default"} className="rounded-full">
            <Link href={hrefFor(1, undefined)}>{t.allStatuses}</Link>
          </Button>
          {CUSTOM_ORDER_STATUSES.map((status) => (
            <Button key={status} asChild size="sm" variant={query.status === status ? "default" : "outline"} className="rounded-full">
              <Link href={hrefFor(1, status)}>{t.status[status]}</Link>
            </Button>
          ))}
        </nav>

        {items.length ? (
          <>
            <CustomOrdersTable items={items} locale={locale} labels={t} types={dict.store.customOrder.types} />
            <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                {pagination.summary
                  .replace("{from}", formatNumber((meta.page - 1) * meta.limit + 1, locale))
                  .replace("{to}", formatNumber((meta.page - 1) * meta.limit + items.length, locale))
                  .replace("{total}", formatNumber(meta.total, locale))}
              </span>
              <Pager page={meta.page} pages={meta.pages} hrefFor={(page) => hrefFor(page)} labels={pagination} />
            </footer>
          </>
        ) : (
          <EmptyState illustration={query.status ? "empty-search" : "empty-cart"} title={query.status ? t.emptyFiltered : t.empty} description={query.status ? undefined : t.emptyHint} />
        )}
      </div>
    </div>
  );
}
