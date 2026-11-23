import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { HomePage } from "@/components/routes/home-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { howItWorksJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: { absolute: "Gratis Castle — Free items in Nigeria | Give freely, receive gratefully" },
  description: "Nigeria's free community marketplace. Find useful things shared for free by neighbours, give away what you no longer need, and collect safely from our Lagos pickup hub or get it delivered free anywhere in Nigeria.",
  alternates: { canonical: "/" },
  keywords: ["free items Nigeria", "free stuff Lagos", "give away items Nigeria", "free marketplace Nigeria", "community marketplace Lagos", "free furniture Nigeria", "free electronics Lagos", "Gratis Castle"],
  other: {
    "geo.region": "NG",
    "geo.placename": "Nigeria",
  },
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("home", baseMetadata);
}

export default function Page() {
  return (
    <>
      <HomePage />
      <PageJsonLd
        pageKey="home"
        data={[
          howItWorksJsonLd(),
          breadcrumbJsonLd([{ name: "Home", url: "/" }]),
        ]}
      />
    </>
  );
}
