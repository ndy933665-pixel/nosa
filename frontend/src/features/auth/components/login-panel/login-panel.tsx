import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { DASHBOARD_ROLES } from "@nosa/contracts";
import { Illustration } from "@/shared/components/illustration";
import { Logo } from "@/shared/components/logo";
import { ThreadLine } from "@/shared/components/thread-line";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { getSession } from "@/shared/lib/auth";
import { logout } from "@/shared/lib/auth/logout.action";
import { Button } from "@/shared/ui/button";
import { LoginForm } from "../login-form";

type LoginPanelProps = {
  searchParams: Promise<{ next?: string }>;
  /** "store" = customers' /login, "staff" = the dashboard's /nosa. */
  area: "store" | "staff";
};

/** Reads the session and ?next= at request time, so the page wraps it in <Suspense>. */
export async function LoginPanel({ searchParams, area }: LoginPanelProps) {
  const [locale, dict, messages, { next }, user] = await Promise.all([
    getLocale(),
    getDictionary(),
    getFeedbackMessages(),
    searchParams,
    getSession(),
  ]);

  const isStaff = !!user && (DASHBOARD_ROLES as readonly string[]).includes(user.role);
  const wantsDashboard = area === "staff" && (!next || next.startsWith(`/${locale}/dashboard`));
  // A customer heading to the dashboard stays here and is told to switch accounts, instead of landing on the home page.
  const switchAccount = !!user && !isStaff && wantsDashboard;
  if (user && !switchAccount) {
    redirect(next?.startsWith(`/${locale}/`) ? next : isStaff ? `/${locale}/dashboard` : `/${locale}/account/orders`);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-soft lg:grid-cols-2">
      <section className="stitch-soft m-3 flex flex-col gap-6 rounded-2xl border-2 p-6 sm:p-10">
        <Logo href={`/${locale}`} className="h-24 self-center" priority />
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold text-primary-800">{dict.auth.welcome}</h1>
          <p className="text-muted-foreground">{dict.auth.subtitle}</p>
          <ThreadLine variant="heart" className="w-40" />
        </header>
        {switchAccount ? (
          <div role="status" className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary-300 bg-primary-50 p-5">
            <p className="text-primary-800">{dict.auth.switchAccount.text.replace("{name}", user.name)}</p>
            <div className="flex flex-wrap gap-2">
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="next" value={next ?? `/${locale}/dashboard`} />
                <Button type="submit">
                  <LogOut />
                  {dict.auth.switchAccount.signOut}
                </Button>
              </form>
              <Button asChild variant="outline">
                <Link href={`/${locale}`}>{dict.auth.switchAccount.backHome}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <LoginForm locale={locale} next={next} labels={dict.auth} messages={messages} />
        )}
      </section>
      <aside className="relative flex flex-col items-center justify-end gap-4 bg-secondary/60 px-6 pt-10 pb-6">
        <p className="text-center font-script text-4xl leading-snug text-primary-600">{dict.auth.tagline}</p>
        <Illustration name="yarn-basket" alt="" className="w-full max-w-md" />
      </aside>
    </div>
  );
}
