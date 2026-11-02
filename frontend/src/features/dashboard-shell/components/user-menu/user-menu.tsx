import Link from "next/link";
import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import type { Locale, SessionUser } from "@nosa/contracts";
import { LocaleSwitcher } from "@/shared/components/locale-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { logout } from "@/shared/lib/auth/logout.action";

type UserMenuProps = {
  user: SessionUser;
  locale: Locale;
  roleLabel: string;
  labels: { logout: string; account: string; switchLocale: string };
};

export function UserMenu({ user, locale, roleLabel, labels }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full py-1 pe-3 ps-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-10">
          {user.avatar && <AvatarImage src={user.avatar} alt="" />}
          <AvatarFallback className="bg-primary-100 font-medium text-primary-800">{user.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start text-start leading-tight sm:flex">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-xs text-muted-foreground">{roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/account`}>
            <KeyRound aria-hidden />
            {labels.account}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <LocaleSwitcher label={labels.switchLocale} />
        </div>
        <DropdownMenuSeparator />
        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          {/* Back to the dashboard's own sign-in page, not the customers' one. */}
          <input type="hidden" name="next" value={`/${locale}/dashboard`} />
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut aria-hidden />
              {labels.logout}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
