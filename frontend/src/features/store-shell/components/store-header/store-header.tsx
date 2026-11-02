import type { ReactNode } from "react";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { LOCALE_DIR, type Locale } from "@nosa/contracts";
import { LocaleSwitcher } from "@/shared/components/locale-switcher";
import { Logo } from "@/shared/components/logo";
import type { Dictionary } from "@/shared/i18n/get-dictionary";
import { Button } from "@/shared/ui/button";
import { MobileNav, type NavLink } from "../mobile-nav";

type StoreHeaderProps = {
  locale: Locale;
  dict: Dictionary;
  /** Top-level categories, already localised by the layout. */
  categories: { slug: string; label: string }[];
  /** The cart button (owned by the cart feature, composed in by the layout). */
  cartSlot?: ReactNode;
};

export function StoreHeader({ locale, dict, categories, cartSlot }: StoreHeaderProps) {
  const nav = dict.store.nav;
  const links: NavLink[] = [
    { href: `/${locale}/shop`, label: nav.allProducts },
    ...categories.map((category) => ({ href: `/${locale}/shop/${category.slug}`, label: category.label })),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-dashed border-primary-200 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <MobileNav
          locale={locale}
          links={links}
          side={LOCALE_DIR[locale] === "rtl" ? "right" : "left"}
          labels={{ menu: nav.menu, close: nav.close, search: nav.search, searchPlaceholder: dict.store.search.placeholder }}
        />
        <Logo href={`/${locale}`} className="h-14 sm:h-[4.25rem]" priority />

        <nav aria-label={nav.menu} className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary-50 hover:text-primary-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1 sm:gap-2 lg:ms-0">
          <form action={`/${locale}/search`} role="search" className="relative hidden 2xl:block">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              name="q"
              type="search"
              placeholder={dict.store.search.placeholder}
              aria-label={nav.search}
              className="h-10 w-56 rounded-full border bg-card ps-9 pe-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </form>
          <Button asChild variant="ghost" size="icon" className="2xl:hidden">
            <Link href={`/${locale}/search`} aria-label={nav.search}>
              <Search />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href={`/${locale}/account/orders`} aria-label={nav.account}>
              <User />
            </Link>
          </Button>
          {cartSlot}
          <LocaleSwitcher label={dict.common.switchLocale} className="hidden sm:inline-block" />
        </div>
      </div>
    </header>
  );
}
