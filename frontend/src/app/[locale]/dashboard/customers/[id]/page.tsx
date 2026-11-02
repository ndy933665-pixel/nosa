import { Suspense } from "react";
import { CustomerProfile } from "@/features/customers/dashboard/customer-profile";
import { OrdersList } from "@/features/orders/dashboard/orders-list";
import { Skeleton } from "@/shared/ui/skeleton";

/** A customer's page: their profile and numbers, then all their orders with the same tabs as the orders screen. */
export default function CustomerPage({ params, searchParams }: PageProps<"/[locale]/dashboard/customers/[id]">) {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-2xl" />}>
        <CustomerProfile params={params} />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <OrdersList searchParams={searchParams} customer={params} />
      </Suspense>
    </div>
  );
}
