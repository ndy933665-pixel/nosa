import { connection } from "next/server";
import { PageHeader } from "@/shared/components/page-header";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { getSession } from "@/shared/lib/auth";
import { emptyCustomOrderDraft } from "../../lib/custom-order-draft";
import { CustomOrderForm } from "../custom-order-form";

/** Reads the session (cookies), so the route wraps it in <Suspense>. */
export async function CustomOrderPage() {
  await connection();
  const [locale, dict, messages, user] = await Promise.all([getLocale(), getDictionary(), getFeedbackMessages(), getSession()]);
  const t = dict.store.customOrder;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <CustomOrderForm
        locale={locale}
        initial={emptyCustomOrderDraft({ name: user?.name ?? "", phone: user?.phone ?? "" })}
        signedIn={Boolean(user)}
        labels={t}
        dateLabels={dict.common.datePicker}
        messages={messages}
      />
    </div>
  );
}
