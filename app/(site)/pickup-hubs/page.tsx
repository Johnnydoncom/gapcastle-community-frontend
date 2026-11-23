import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { Suspense } from "react";
import { PickupHubsPage, PickupHubsSkeleton } from "@/components/routes/pickup-hubs-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Pickup hubs in Lagos Nigeria — Collect free items",
  description: "Collect free items from a Gratis Castle pickup hub in Lagos Nigeria — or get them delivered free anywhere else in Nigeria. Safe, free handovers at our managed locations.",
  alternates: { canonical: "/pickup-hubs" },
  keywords: ["pickup hubs Lagos", "collect free items Nigeria", "Gratis Castle pickup locations", "free item collection Lagos", "free delivery Nigeria"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("pickup-hubs", baseMetadata);
}

export default function Page() {
  return (
    <>
      <Suspense fallback={<PickupHubsSkeleton />}>
        <PickupHubsPage />
      </Suspense>
      <PageJsonLd
        pageKey="pickup-hubs"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Pickup hubs", url: "/pickup-hubs" },
          ]),
        ]}
      />
    </>
  );
}
