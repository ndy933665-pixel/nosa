import type { ReactNode } from "react";
import { DASHBOARD_ROLES } from "@nosa/contracts";
import { ErrorBoundary } from "@/shared/components/error-boundary";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { redirect } from "next/navigation";
import { requireUser } from "@/shared/lib/auth";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { ChangePasswordForm } from "../change-password-form";
import { DashboardSidebar } from "../dashboard-sidebar";
import { UserMenu } from "../user-menu";

/**
 * Guards the whole dashboard and draws its frame. It reads the session, so the layout wraps it in <Suspense>.
 * The role check here is the real one for pages; Express re-checks on every API call.
 */
export async function DashboardShell({ children }: { children: ReactNode }) {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const next = `/${locale}/dashboard`;
  const user = await requireUser(locale, next);
  // Signed in with a customer account: the login page explains it and offers to switch accounts.
  if (!(DASHBOARD_ROLES as readonly string[]).includes(user.role)) redirect(`/${locale}/nosa?next=${encodeURIComponent(next)}`);

  // A temporary password (new staff, or reset by a manager) must be replaced before anything else opens.
  if (user.mustChangePassword) {
    const messages = await getFeedbackMessages();
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-4">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-card p-6 shadow-card">
          <header className="text-center">
            <h1 className="font-display text-2xl font-semibold text-primary-800">{dict.dashboard.account.forcedTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{dict.dashboard.account.forcedText}</p>
          </header>
          <ChangePasswordForm labels={dict.dashboard.account} invalidMessage={dict.dashboard.productForm.invalid} messages={messages} />
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <DashboardSidebar locale={locale} role={user.role} dict={dict.dashboard} />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="-ms-1" />
          <div className="ms-auto">
            <UserMenu
              user={user}
              locale={locale}
              roleLabel={dict.dashboard.roles[user.role]}
              labels={{ logout: dict.dashboard.user.logout, account: dict.dashboard.user.account, switchLocale: dict.common.switchLocale }}
            />
          </div>
        </header>
        {/* A failing screen shows its own message; the sidebar and top bar keep working. */}
        <div className="flex-1 p-4 sm:p-6">
          <ErrorBoundary labels={{ title: dict.errors.pageTitle, text: dict.errors.pageText, retry: dict.errors.retry, requestId: dict.errors.requestId }}>
            {children}
          </ErrorBoundary>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
