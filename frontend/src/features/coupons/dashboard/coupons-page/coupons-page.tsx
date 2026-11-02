import { connection } from "next/server";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { getFeedbackMessages } from "@/shared/i18n/get-feedback-messages";
import { requireRole } from "@/shared/lib/auth";
import { CouponsTable } from "../coupons-table";
import { listCoupons } from "./coupons-page.data";

export async function CouponsPage() {
  await connection();
  const locale = await getLocale();
  // Only admins and owners manage coupons; anyone else gets the 403 page.
  await requireRole(locale, ["admin", "owner"], `/${locale}/dashboard/coupons`);
  const [dict, messages, coupons] = await Promise.all([getDictionary(), getFeedbackMessages(), listCoupons()]);

  return <CouponsTable coupons={coupons} locale={locale} labels={dict.dashboard.coupons} invalidMessage={dict.dashboard.productForm.invalid} messages={messages} dateLabels={dict.common.datePicker} />;
}
