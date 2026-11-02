import Link from "next/link";
import type { Locale, ProductCardDto } from "@nosa/contracts";
import { MediaImage } from "@/shared/components/media-image";
import { Price } from "@/shared/components/price";
import { RatingStars } from "@/shared/components/rating-stars";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { cn } from "@/shared/lib/utils";

type ProductCardProps = {
  product: ProductCardDto;
  locale: Locale;
  labels: Dictionary["store"]["product"];
  /** Only for the first row above the fold (the LCP image). */
  priority?: boolean;
  className?: string;
};

/** One product in a grid or a row. The whole card is the link, so it stays a Server Component. */
export function ProductCard({ product, locale, labels, priority, className }: ProductCardProps) {
  const name = product.name[locale];
  const onSale = product.salePrice !== undefined && product.salePrice < product.price;
  const amount = onSale ? product.salePrice! : product.price;

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition-[transform,box-shadow] duration-300 ease-thread hover:shadow-soft motion-safe:hover:-translate-y-1", className)}>
      <Link href={`/${locale}/product/${product.slug}`} className="flex flex-1 flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className="relative block aspect-[4/5] overflow-hidden bg-muted">
          <MediaImage
            image={product.image}
            alt={product.image?.alt?.[locale] || name}
            fill
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute start-2 top-2 flex flex-wrap gap-1">
            {onSale && <span className="rounded-full bg-yarn-500 px-2.5 py-0.5 text-xs font-medium text-white">{labels.sale}</span>}
            {!product.inStock && <span className="rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-medium text-white">{labels.outOfStock}</span>}
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug sm:text-base">{name}</h3>
          {product.rating.count > 0 && (
            <RatingStars value={product.rating.average} count={product.rating.count} label={labels.rating.replace("{value}", String(product.rating.average))} />
          )}
          {product.colors.length > 0 && (
            <span className="flex gap-1.5" aria-hidden>
              {product.colors.slice(0, 5).map((color) => (
                // Swatches are data (the owner picks the hex), so they are the one place with an inline color.
                <span key={color.value} className="size-4 rounded-full border border-black/10" style={{ backgroundColor: color.hex ?? "transparent" }} />
              ))}
            </span>
          )}
          <Price amount={amount} compareAt={onSale ? product.price : undefined} locale={locale} className="mt-auto pt-1" />
        </span>
      </Link>
    </article>
  );
}
