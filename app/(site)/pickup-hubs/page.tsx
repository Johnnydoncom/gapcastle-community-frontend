import type { Metadata } from "next";
import { Suspense } from "react";
import { PickupHubsPage, PickupHubsSkeleton } from "@/components/routes/pickup-hubs-page";

export const metadata: Metadata = {
  title: "Pickup hubs",
  description: "Collect free items from a Gratis Castle pickup hub in Lagos, Ogun, Oyo or Abuja — or get them by waybill anywhere in Nigeria.",
  alternates: { canonical: "/pickup-hubs" },
};

export default function Page() {
  return (
    <Suspense fallback={<PickupHubsSkeleton />}>
      <PickupHubsPage />
    </Suspense>
  );
}
