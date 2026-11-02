import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomOrderPage } from "@/features/custom-orders/components/custom-order-page";
import { getDictionary } from "@/shared/i18n/get-dictionary";
import { Skeleton } from "@/shared/ui/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.store.customOrder.title };
}

export default function CustomOrderRoute() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto my-6 h-[36rem] w-full max-w-3xl rounded-2xl" />}>
      <CustomOrderPage />
    </Suspense>
  );
}
