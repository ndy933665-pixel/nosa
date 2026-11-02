import { Suspense } from "react";
import { CustomOrdersList } from "@/features/custom-orders/dashboard/custom-orders-list";
import { Skeleton } from "@/shared/ui/skeleton";

export default function CustomOrdersPage({ searchParams }: PageProps<"/[locale]/dashboard/custom-orders">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <CustomOrdersList searchParams={searchParams} />
    </Suspense>
  );
}
