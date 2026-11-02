import Link from "next/link";
import type { Locale } from "@nosa/contracts";
import { ProductGrid } from "@/shared/components/product-grid";
import { Reveal } from "@/shared/components/reveal";
import { SectionTitle } from "@/shared/components/section-title";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { listProducts } from "../../api/catalog.queries";

type ProductsSectionProps = {
  title: string;
  source: "featured" | "newest" | "bestsellers" | "category";
  categorySlug?: string;
  limit: number;
  locale: Locale;
  dict: Dictionary;
};

/** Which API filter each home "source" means. */
const QUERIES = {
  featured: { featured: true, sort: "newest" },
  newest: { sort: "newest" },
  bestsellers: { sort: "popular" },
  category: { sort: "newest" },
} as const;

/** A titled row of products for the home page (best sellers, new arrivals, one category...). */
export async function ProductsSection({ title, source, categorySlug, limit, locale, dict }: ProductsSectionProps) {
  const { items } = await listProducts({ ...QUERIES[source], limit, ...(source === "category" && categorySlug && { category: categorySlug }) });
  if (!items.length) return null;

  const href = source === "category" && categorySlug ? `/${locale}/shop/${categorySlug}` : `/${locale}/shop`;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <Reveal>
        <SectionTitle
          variant="inline"
          title={title}
          action={
            <Link href={href} className="shrink-0 text-sm font-medium text-primary-700 hover:underline">
              {dict.common.viewAll}
            </Link>
          }
        />
      </Reveal>
      <ProductGrid products={items} locale={locale} labels={dict.store.product} animated className="mt-6" />
    </section>
  );
}
