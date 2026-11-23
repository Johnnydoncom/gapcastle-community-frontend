import type { Metadata } from "next";
import { Suspense } from "react";
import { RequestCheckoutPage, RequestCheckoutSkeleton } from "@/components/routes/request-checkout-page";

type Props = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<RequestCheckoutSkeleton />}>
      {params.then(({ slug }) => <RequestCheckoutPage slug={slug} />)}
    </Suspense>
  );
}
