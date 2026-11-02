import { Suspense } from "react";
import { CartButton, CartLink } from "@/features/cart/components/cart-button";
import { getFooterPages } from "@/features/cms/api/cms.queries";
import { listNavCategories } from "@/features/catalog/api/nav-categories";
import { AnnouncementBar } from "@/features/store-shell/components/announcement-bar";
import { StoreFooter } from "@/features/store-shell/components/store-footer";
import { StoreHeader } from "@/features/store-shell/components/store-header";
import { WhatsappFloat } from "@/features/store-shell/components/whatsapp-float";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getPublicSettings } from "@/shared/lib/settings/get-public-settings";

export default async function StoreLayout({ children }: LayoutProps<"/[locale]">) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const errorLabels = { title: dict.errors.pageTitle, text: dict.errors.pageText, retry: dict.errors.retry, requestId: dict.errors.requestId };
  const [settings, categories, pages] = await Promise.all([getPublicSettings(), listNavCategories(locale), getFooterPages()]);
  const announcement = settings.announcement.enabled ? settings.announcement.text[locale] : undefined;

  return (
    <>
      <AnnouncementBar text={announcement} />
      <ErrorBoundary labels={errorLabels} compact>
        <StoreHeader
          locale={locale}
          dict={dict}
          categories={categories}
          cartSlot={
            // The cart count reads cookies, so it streams in after the (prerendered) header.
            <Suspense fallback={<CartLink locale={locale} label={dict.store.nav.cart} />}>
              <CartButton label={dict.store.nav.cart} />
            </Suspense>
          }
        />
      </ErrorBoundary>
      <main id="main" className="flex-1">{children}</main>
      <ErrorBoundary labels={errorLabels} compact>
        <StoreFooter locale={locale} dict={dict} settings={settings} categories={categories} pages={pages} />
      </ErrorBoundary>
      <WhatsappFloat phone={settings.contact.whatsapp} label={dict.common.whatsappChat} message={dict.common.whatsappHello} />
    </>
  );
}
