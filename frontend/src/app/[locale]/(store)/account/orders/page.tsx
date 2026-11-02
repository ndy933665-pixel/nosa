import { Suspense } from "react";
import type { Metadata } from "next";
import { MyOrders } from "@/features/orders/components/my-orders";
import { getDictionary } from "@/shared/i18n/get-dictionary";
import { Skeleton } from "@/shared/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.store.myOrders.title, robots: { index: false } };
}

export default function MyOrdersPage({ searchParams }: PageProps<"/[locale]/account/orders">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-8 h-[32rem] w-full max-w-3xl rounded-2xl" />}>
      <MyOrders searchParams={searchParams} />
    </Suspense>
  );
}
