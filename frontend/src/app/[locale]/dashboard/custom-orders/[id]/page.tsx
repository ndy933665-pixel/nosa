import { Suspense } from "react";
import { CustomOrderDetail } from "@/features/custom-orders/dashboard/custom-order-detail";
import { Skeleton } from "@/shared/ui/skeleton";

export default function CustomOrderPage({ params }: PageProps<"/[locale]/dashboard/custom-orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <CustomOrderDetail params={params} />
    </Suspense>
  );
}
