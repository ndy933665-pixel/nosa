import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { connection } from "next/server";
import { MediaImage } from "@/shared/components/media-image";
import { PageHeader } from "@/shared/components/page-header";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { formatDate, formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { CustomOrderQuote } from "../custom-order-quote";
import { CustomOrderStatusBadge } from "../custom-order-status-badge";
import { CustomOrderStatusPanel } from "../custom-order-status-panel";
import { getDashboardCustomOrder } from "./custom-order-detail.data";

const digits = (phone: string) => phone.replace(/\D/g, "");

const cardClass = "flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-card sm:p-5";

export async function CustomOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const [{ id }, locale, dict, messages] = await Promise.all([params, getLocale(), getDictionary(), getFeedbackMessages()]);
  const order = await getDashboardCustomOrder(id);
  const t = dict.dashboard.customOrdersScreen;
  const d = t.detail;
  const canQuote = order.status === "new" || order.status === "quoted";
  // A quote goes through its own form, never through the plain status move.
  const nextStatuses = (order.allowedNextStatuses ?? []).filter((status) => status !== "quoted");

  const facts = [
    { label: d.type, value: dict.store.customOrder.types[order.type] },
    { label: d.sizes, value: order.sizes },
    { label: d.colors, value: order.colors },
    { label: d.budget, value: order.budget ? formatPrice(order.budget, locale) : undefined },
    { label: d.neededBy, value: order.neededBy ? formatDate(order.neededBy, locale) : undefined },
  ].filter((fact) => fact.value);

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/${locale}/dashboard/custom-orders`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
        {d.back}
      </Link>

      <PageHeader
        title={<span dir="ltr">{order.number}</span>}
        subtitle={formatDate(order.createdAt, locale)}
        action={<CustomOrderStatusBadge status={order.status} label={t.status[order.status]} className="px-3 py-1 text-sm" />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className={cardClass}>
            <h2 className="font-display text-xl text-primary-800">{d.request}</h2>
            <p className="whitespace-pre-line text-sm">{order.description}</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                  <dd className="font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl text-primary-800">{d.references}</h2>
            {order.referenceImages.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {order.referenceImages.map((image) => (
                  <li key={image.publicId} className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
                    <MediaImage image={image} alt="" fill sizes="(min-width: 640px) 200px, 45vw" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{d.noImages}</p>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl text-primary-800">{d.history}</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {[...order.history].reverse().map((entry, index) => (
                <li key={`${entry.status}-${entry.at}-${index}`} className="flex flex-col rounded-lg bg-muted/50 px-3 py-2">
                  <span className="font-medium">
                    {t.status[entry.status]} <span className="text-xs font-normal text-muted-foreground">· {formatDate(entry.at, locale)}</span>
                  </span>
                  {entry.note && <span className="text-muted-foreground">{entry.note}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className={cardClass}>
            <h2 className="font-display text-xl text-primary-800">{d.customer}</h2>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{order.contact.name}</span>
              <span dir="ltr" className="text-start text-muted-foreground">
                {order.contact.phone}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${order.contact.phone}`}>
                  <Phone aria-hidden />
                  {d.call}
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`https://wa.me/${digits(order.contact.phone).replace(/^0/, "20")}`} target="_blank" rel="noreferrer">
                  <MessageCircle aria-hidden />
                  {d.whatsapp}
                </a>
              </Button>
            </div>
          </section>

          {canQuote && (
            <section className={cardClass}>
              <h2 className="font-display text-xl text-primary-800">{d.quote.title}</h2>
              {order.quote && (
                <p className="rounded-lg bg-blush px-3 py-2 text-sm">
                  {d.quote.current.replace("{price}", formatPrice(order.quote.price, locale)).replace("{days}", String(order.quote.productionDays))}
                </p>
              )}
              <CustomOrderQuote
                orderId={order.id}
                initial={order.quote ?? {}}
                labels={d.quote}
                invalidMessage={dict.store.customOrder.invalid}
                messages={messages}
              />
            </section>
          )}

          <section className={cardClass}>
            <h2 className="font-display text-xl text-primary-800">{d.status.title}</h2>
            <CustomOrderStatusPanel orderId={order.id} allowed={nextStatuses} labels={d.status} statusNames={t.status} messages={messages} />
          </section>
        </div>
      </div>
    </div>
  );
}
