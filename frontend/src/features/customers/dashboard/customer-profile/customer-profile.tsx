import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { connection } from "next/server";
import { PageHeader } from "@/shared/components/page-header";
import { getDictionary, getLocale } from "@/shared/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { whatsappLink } from "@/shared/lib/whatsapp";
import { Button } from "@/shared/ui/button";
import { getCustomerProfile } from "./customer-profile.data";

const statClass = "flex flex-col gap-1 rounded-2xl border bg-card p-4 shadow-card";

/** The top of a customer's page: who they are and how many orders were confirmed, are waiting or were cancelled. */
export async function CustomerProfile({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const [{ id }, locale, dict] = await Promise.all([params, getLocale(), getDictionary()]);
  const { customer, summary } = await getCustomerProfile(id);
  const t = dict.dashboard.customers;
  const p = t.profile;

  const stats = [
    { label: t.orderGroups.confirmed, value: formatNumber(summary.confirmed, locale), tone: "text-success" },
    { label: t.orderGroups.pending, value: formatNumber(summary.pending, locale), tone: "text-warning" },
    { label: t.orderGroups.cancelled, value: formatNumber(summary.cancelled, locale), tone: "text-yarn-600" },
    { label: p.spent, value: formatPrice(summary.spent, locale), tone: "text-primary-800" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Link href={`/${locale}/dashboard/customers`} className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
        {p.back}
      </Link>

      <PageHeader
        title={customer.name}
        subtitle={p.joined.replace("{date}", formatDate(customer.createdAt, locale))}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${customer.phone}`}>
                <Phone />
                <span dir="ltr">{customer.phone}</span>
              </a>
            </Button>
            <Button asChild size="sm" className="bg-whatsapp text-white hover:bg-whatsapp-dark">
              <a href={whatsappLink(customer.phone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                {p.whatsapp}
              </a>
            </Button>
          </div>
        }
      />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={statClass}>
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className={cn("font-display text-2xl font-semibold tabular-nums", stat.tone)}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="font-display text-xl text-primary-800">{p.orders}</h2>
    </div>
  );
}
