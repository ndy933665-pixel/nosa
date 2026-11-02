import Link from "next/link";
import { connection } from "next/server";
import { Clock, LogOut, MessageCircle } from "lucide-react";
import { ORDER_STATUS_GROUPS, orderStatusGroup } from "@nosa/contracts";
import { EmptyState } from "@/shared/components/empty-state";
import { FilterTabs } from "@/shared/components/filter-tabs";
import { MediaImage } from "@/shared/components/media-image";
import { StatusBadge } from "@/shared/components/status-badge";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { logout } from "@/shared/lib/auth/logout.action";
import { formatDate, formatNumber, formatPrice } from "@/shared/lib/format";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";
import { whatsappLink } from "@/shared/lib/whatsapp";
import { Button } from "@/shared/ui/button";
import { DeliveryDetails } from "../delivery-details";
import { getMyOrders, parseGroup } from "./my-orders.data";

type MyOrdersProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const cardClass = "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5";

/** "My orders": every order of the signed-in customer, filtered by waiting / confirmed / cancelled. */
export async function MyOrders({ searchParams }: MyOrdersProps) {
  await connection();
  const [locale, dict, params, settings] = await Promise.all([getLocale(), getDictionary(), searchParams, getPublicSettings()]);
  const { user, orders, counts } = await getMyOrders(locale);
  const t = dict.store.myOrders;
  const group = parseGroup(params.group);
  const shown = group ? orders.filter((order) => orderStatusGroup(order.status) === group) : orders;
  const base = `/${locale}/account/orders`;
  const whatsapp = settings.contact.whatsapp;

  const tabs = [
    { key: "all", label: t.groups.all, href: base, count: counts.all },
    ...ORDER_STATUS_GROUPS.map((key) => ({ key, label: t.groups[key], href: `${base}?group=${key}`, count: counts[key] })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary-800">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.hello.replace("{name}", user.name)}</p>
        </div>
        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            <LogOut />
            {t.logout}
          </Button>
        </form>
      </header>

      <FilterTabs tabs={tabs} active={group ?? "all"} label={t.groups.label} locale={locale} />

      {shown.length ? (
        <ul className="flex flex-col gap-4">
          {shown.map((order) => {
            const state = orderStatusGroup(order.status);
            return (
              <li key={order.id} className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p dir="ltr" className="text-start font-semibold">
                      {order.number}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt, locale)}</p>
                  </div>
                  <StatusBadge status={order.status} label={dict.orderStatus[order.status]} className="px-3 py-1 text-sm" />
                </div>

                <ul className="flex flex-col gap-3 border-t border-dashed pt-4">
                  {order.items.map((item, index) => (
                    <li key={`${item.sku ?? item.slug}-${index}`} className="flex items-center gap-3 text-sm">
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        <MediaImage image={item.image} alt="" fill sizes="56px" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link href={`/${locale}/product/${item.slug}`} className="font-medium hover:text-primary">
                          {item.name[locale]}
                        </Link>
                        {item.optionLabels.length > 0 && <span className="text-muted-foreground">{item.optionLabels.map((label) => label[locale]).join(" · ")}</span>}
                        {Object.values(item.customization).length > 0 && <span className="text-primary-700">{Object.values(item.customization).join(" · ")}</span>}
                      </div>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {formatNumber(item.quantity, locale)} × {formatPrice(item.unitPrice, locale)}
                      </span>
                    </li>
                  ))}
                </ul>

                {state === "confirmed" && (order.shipment || order.address) && (
                  <div className="rounded-xl bg-blush/60 p-3">
                    <DeliveryDetails address={order.address} shipment={order.shipment} locale={locale} labels={dict.common.delivery} />
                  </div>
                )}

                {state === "pending" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-warning-50 p-3 text-sm text-warning">
                    <span className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0" aria-hidden />
                      {t.pendingNote}
                    </span>
                    {whatsapp && (
                      <Button asChild size="sm" className="bg-whatsapp text-white hover:bg-whatsapp-dark">
                        <a href={whatsappLink(whatsapp, t.whatsappMessage.replace("{number}", order.number))} target="_blank" rel="noopener noreferrer">
                          <MessageCircle />
                          {t.whatsapp}
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex justify-between border-t border-dashed pt-4 font-semibold">
                  <span>{t.total}</span>
                  <span className="tabular-nums">{formatPrice(order.total, locale)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          illustration="empty-cart"
          title={group ? t.emptyGroup : t.empty}
          description={group ? undefined : t.emptyHint}
          action={
            <Button asChild size="lg">
              <Link href={`/${locale}/shop`}>{dict.store.cart.continueShopping}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
