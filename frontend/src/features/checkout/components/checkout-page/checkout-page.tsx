import Link from "next/link";
import { connection } from "next/server";
import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { getSession } from "@/shared/lib/auth";
import { getCart } from "@/shared/lib/cart/get-cart";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";
import { Button } from "@/shared/ui/button";
import { emptyCheckoutDraft } from "../../lib/checkout-draft";
import { CheckoutForm } from "../checkout-form";

/** Checkout reads the cart and the session (cookies), so the route wraps it in <Suspense>. */
export async function CheckoutPage() {
  await connection();
  const [locale, dict, messages, cart, user, settings] = await Promise.all([
    getLocale(),
    getDictionary(),
    getFeedbackMessages(),
    getCart(),
    getSession(),
    getPublicSettings(),
  ]);
  const t = dict.store.checkout;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          illustration="empty-cart"
          title={t.emptyCart}
          action={
            <Button asChild size="xl">
              <Link href={`/${locale}/shop`}>{dict.store.cart.continueShopping}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!user && !settings.checkout.allowGuest) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <EmptyState
          illustration="yarn-basket"
          title={t.signInRequired}
          action={
            <Button asChild size="xl">
              <Link href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout`)}`}>{t.signIn}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <PageHeader title={t.title} />
      <CheckoutForm
        locale={locale}
        initial={emptyCheckoutDraft({ name: user?.name ?? "", phone: user?.phone ?? "", email: user?.email ?? "" })}
        lines={cart.items.map(({ id, name, quantity, lineTotal }) => ({ id, name, quantity, lineTotal }))}
        subtotal={cart.subtotal}
        discount={cart.discount}
        labels={t}
        cartLabels={dict.store.cart}
        messages={messages}
      />
    </div>
  );
}
