import Link from "next/link";
import { connection } from "next/server";
import type { OrderDto } from "@nosa/contracts";
import { EmptyState } from "@/shared/components/empty-state";
import { MessageCircle } from "lucide-react";
import { Illustration } from "@/shared/components/illustration";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";
import { whatsappLink } from "@/shared/lib/whatsapp";
import { HttpError } from "@/shared/lib/api/http";
import { formatPrice } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { checkoutApi } from "../../api/checkout.api";
import { readLastOrder } from "../../lib/last-order-cookie";
import { orderWhatsappMessage } from "../../lib/order-whatsapp-message";

/** The thank-you page. A guest sees the order only from the browser that placed it (cookie), never by number alone. */
export async function OrderConfirmation({ params }: { params: Promise<{ number: string }> }) {
  await connection();
  const [{ number }, locale, dict, last, settings] = await Promise.all([params, getLocale(), getDictionary(), readLastOrder(), getPublicSettings()]);
  const t = dict.store.order;

  let order: OrderDto | null = null;
  if (last && last.number === number) {
    try {
      order = (await checkoutApi.track(last.number, last.phone)).data;
    } catch (error) {
      if (!(error instanceof HttpError && error.status === 404)) throw error;
    }
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          illustration="empty-search"
          title={t.notFound}
          description={t.notFoundText}
          action={
            <Button asChild size="xl">
              <Link href={`/${locale}/shop`}>{dict.store.cart.continueShopping}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const whatsappNumber = settings.contact.whatsapp;
  const whatsappHref = whatsappNumber
    ? whatsappLink(
        whatsappNumber,
        orderWhatsappMessage(order, locale, dict),
      )
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-8 text-center sm:px-6">
      <Illustration name="yarn-happy" alt="" className="w-64" priority />
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary-800 sm:text-4xl">{t.thanksTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.thanksText}</p>
      </div>

      <section className="stitch-soft flex w-full flex-col gap-4 rounded-2xl border bg-card p-5 text-start shadow-card">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{t.number}</dt>
            <dd dir="ltr" className="text-start text-lg font-semibold">{order.number}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.status}</dt>
            <dd className="text-lg font-semibold">{dict.orderStatus[order.status]}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.payment}</dt>
            <dd>{t.cod}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.delivery}</dt>
            <dd>{t.deliveryText}</dd>
          </div>
        </dl>

        <div className="border-t border-dashed pt-4">
          <h2 className="mb-2 font-medium">{t.items}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {order.items.map((item, index) => (
              <li key={`${item.sku ?? item.slug}-${index}`} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {item.name[locale]}
                  {item.optionLabels.length > 0 && <span className="text-muted-foreground"> ({item.optionLabels.map((label) => label[locale]).join(" · ")})</span>}
                </span>
                <span className="shrink-0">{formatPrice(item.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="flex flex-col gap-1 border-t border-dashed pt-4 text-sm">
          {order.discount > 0 && (
            <div className="flex justify-between text-success">
              <dt>{dict.store.cart.discount}</dt>
              <dd>−{formatPrice(order.discount, locale)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <dt>{t.total}</dt>
            <dd>{formatPrice(order.total, locale)}</dd>
          </div>
        </dl>
      </section>

      {whatsappHref && (
        <div className="flex flex-col items-center gap-2">
          <Button asChild size="xl">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              {t.whatsappCta}
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">{t.whatsappNote}</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t.keepNumber}</p>
      <Button asChild size="xl" variant="outline">
        <Link href={`/${locale}/shop`}>{dict.store.cart.continueShopping}</Link>
      </Button>
    </div>
  );
}
