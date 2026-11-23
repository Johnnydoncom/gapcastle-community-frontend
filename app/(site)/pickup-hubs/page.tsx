import type { Metadata } from "next";
import { Suspense } from "react";
import { PickupHubsPage, PickupHubsSkeleton } from "@/components/routes/pickup-hubs-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pickup hubs in Lagos Nigeria — Collect free items",
  description: "Collect free items from a Gratis Castle pickup hub in Lagos Nigeria — or get them delivered free anywhere else in Nigeria. Safe, free handovers at our managed locations.",
  alternates: { canonical: "/pickup-hubs" },
  keywords: ["pickup hubs Lagos", "collect free items Nigeria", "Gratis Castle pickup locations", "free item collection Lagos", "free delivery Nigeria"],
};

export default function Page() {
  return (
    <>
      <Suspense fallback={<PickupHubsSkeleton />}>
        <PickupHubsPage />
      </Suspense>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Pickup hubs", url: "/pickup-hubs" },
      ])} />
    </>
  );
}
