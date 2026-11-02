import { connection } from "next/server";
import { ORDER_STATUS_GROUPS } from "@nosa/contracts";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterTabs } from "@/shared/components/filter-tabs";
import { PageHeader } from "@/shared/components/page-header";
import { Pager } from "@/shared/components/pager";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { formatNumber } from "@/shared/lib/format";
import { OrdersFilters } from "../orders-filters";
import { OrdersTable } from "../orders-table";
import { listDashboardOrders, parseOrdersQuery } from "./orders-list.data";

type OrdersListProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  /** One customer's orders (their page in Customers): no title or filters, just the tabs and the table. */
  customer?: Promise<{ id: string }>;
};

export async function OrdersList({ searchParams, customer }: OrdersListProps) {
  await connection();
  const [locale, dict, params, customerParams] = await Promise.all([getLocale(), getDictionary(), searchParams, customer]);
  const customerId = customerParams?.id;
  const query = parseOrdersQuery(params);
  const { items, meta, counts } = await listDashboardOrders(query, customerId);
  const t = dict.dashboard.orders;
  const filtered = Boolean(query.q || query.status || query.group || query.paymentMethod);
  const base = customerId ? `/${locale}/dashboard/customers/${customerId}` : `/${locale}/dashboard/orders`;

  // Tabs pick a group and drop the single-status filter; the pager keeps both.
  const hrefFor = (page: number, group: string | null | undefined = query.group, status: string | null | undefined = query.status) => {
    const next = new URLSearchParams();
    if (query.q) next.set("q", query.q);
    if (status) next.set("status", status);
    if (group) next.set("group", group);
    if (query.paymentMethod) next.set("paymentMethod", query.paymentMethod);
    if (page > 1) next.set("page", String(page));
    const search = next.toString();
    return search ? `${base}?${search}` : base;
  };

  const tabs = [
    { key: "all", label: t.groups.all, href: hrefFor(1, null, null), count: counts.all },
    ...ORDER_STATUS_GROUPS.map((group) => ({ key: group, label: t.groups[group], href: hrefFor(1, group, null), count: counts[group] })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {!customerId && <PageHeader title={t.title} subtitle={t.subtitle} />}

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5">
        <FilterTabs tabs={tabs} active={query.group ?? "all"} label={t.groups.label} locale={locale} />
        {!customerId && <OrdersFilters labels={t} orderStatus={dict.orderStatus} />}

        {items.length ? (
          <>
            <OrdersTable items={items} locale={locale} labels={t} orderStatus={dict.orderStatus} sources={dict.store.checkout.sourceOptions} scopes={dict.common.delivery.scopes} />
            <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                {t.pagination.summary
                  .replace("{from}", formatNumber((meta.page - 1) * meta.limit + 1, locale))
                  .replace("{to}", formatNumber((meta.page - 1) * meta.limit + items.length, locale))
                  .replace("{total}", formatNumber(meta.total, locale))}
              </span>
              <Pager page={meta.page} pages={meta.pages} hrefFor={(page) => hrefFor(page)} labels={t.pagination} />
            </footer>
          </>
        ) : filtered ? (
          <EmptyState illustration="empty-search" title={t.emptyFiltered} />
        ) : (
          <EmptyState illustration="empty-cart" title={t.empty} description={customerId ? undefined : t.emptyHint} />
        )}
      </div>
    </div>
  );
}
