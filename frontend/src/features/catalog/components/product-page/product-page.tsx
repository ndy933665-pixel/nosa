import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AddCartItemInput } from "@nosa/contracts";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { RatingStars } from "@/shared/components/rating-stars";
import { siteConfig } from "@/shared/config/site";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import type { ActionState } from "@/shared/lib/action-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { getProduct } from "../../api/catalog.queries";
import { ProductGallery } from "../product-gallery";
import { ProductInfo } from "../product-info";
import { ProductPurchase } from "../product-purchase";
import { RelatedProducts } from "../related-products";

type ProductPageProps = {
  /** Route params of /product/[slug]. */
  params: Promise<{ slug: string }>;
  /** Server action owned by the cart feature, handed in by the route. */
  addToCart: (input: AddCartItemInput) => Promise<ActionState>;
};

export async function ProductPage({ params, addToCart }: ProductPageProps) {
  const [{ slug }, locale, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const product = await getProduct(slug);
  if (!product) notFound();

  const t = dict.store.product;
  const name = product.name[locale];
  const errorLabels = { title: dict.errors.pageTitle, text: dict.errors.pageText, retry: dict.errors.retry, requestId: dict.errors.requestId };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: product.description[locale],
    sku: product.variants[0]?.sku,
    url: `${siteConfig.url}/${locale}/product/${product.slug}`,
    category: product.category.name[locale],
    ...(product.rating.count > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } }),
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: product.salePrice ?? product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-4 sm:px-6 sm:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href={`/${locale}`} className="hover:text-primary-700">{dict.common.home}</Link>
        <span aria-hidden>/</span>
        <Link href={`/${locale}/shop`} className="hover:text-primary-700">{dict.store.shop.breadcrumbShop}</Link>
        <span aria-hidden>/</span>
        <Link href={`/${locale}/shop/${product.category.slug}`} className="hover:text-primary-700">{product.category.name[locale]}</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <ProductGallery
          images={product.images}
          name={name}
          locale={locale}
          labels={{ gallery: t.gallery, previous: t.previousImage, next: t.nextImage, image: t.images }}
        />

        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-3xl font-semibold leading-tight text-primary-900 sm:text-4xl">{name}</h1>
            {product.rating.count > 0 && (
              <RatingStars value={product.rating.average} count={product.rating.count} label={t.rating.replace("{value}", String(product.rating.average))} />
            )}
          </header>

          <ProductPurchase
            product={{
              id: product.id,
              slug: product.slug,
              price: product.price,
              salePrice: product.salePrice,
              options: product.options,
              variants: product.variants,
              stock: product.stock,
              isMadeToOrder: product.isMadeToOrder,
              productionDays: product.productionDays,
              customization: product.customization,
            }}
            locale={locale}
            labels={t}
            dateLabels={dict.common.datePicker}
            messages={{ added: t.added, failed: t.addFailed, chooseOptions: t.chooseOptions, fillFields: t.fillFields }}
            addToCart={addToCart}
            checkoutHref={`/${locale}/checkout`}
          />

          <ProductInfo product={product} locale={locale} labels={t} />
        </div>
      </div>

      <ErrorBoundary labels={errorLabels} compact>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
          <RelatedProducts slug={product.slug} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
