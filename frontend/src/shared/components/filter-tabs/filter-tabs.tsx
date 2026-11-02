import Link from "next/link";
import type { Locale } from "@nosa/contracts";
import { formatNumber } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";

export type FilterTab = { key: string; label: string; href: string; count?: number };

type FilterTabsProps = { tabs: FilterTab[]; active: string; label: string; locale: Locale; className?: string };

/** Link tabs that filter a list through the URL (rendered on the server), each with an optional count. */
export function FilterTabs({ tabs, active, label, locale, className }: FilterTabsProps) {
  return (
    <nav aria-label={label} className={cn("-mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)}>
      {tabs.map((tab) => {
        const current = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              current ? "border-primary-600 bg-primary-600 text-white" : "bg-card text-foreground hover:border-primary-300 hover:text-primary-700",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", current ? "bg-white/20" : "bg-muted text-muted-foreground")}>
                {formatNumber(tab.count, locale)}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
