import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { LoginPanel } from "@/features/auth/components/login-panel";

/** Customers' sign-in. The dashboard signs in at its own unlisted page (/nosa). */
export default function CustomerLoginPage({ searchParams }: PageProps<"/[locale]/login">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[640px] w-full max-w-5xl rounded-3xl" />}>
      <LoginPanel searchParams={searchParams} area="store" />
    </Suspense>
  );
}
