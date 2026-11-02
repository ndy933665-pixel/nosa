import { Suspense } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { LoginPanel } from "@/features/auth/components/login-panel";

export default function LoginPage({ searchParams }: PageProps<"/[locale]/nosa">) {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-[640px] w-full max-w-5xl rounded-3xl" />}>
      <LoginPanel searchParams={searchParams} area="staff" />
    </Suspense>
  );
}
