import type { Metadata } from "next";
import { HomePage } from "@/components/routes/home-page";
import { JsonLd } from "@/components/seo/json-ld";
import { howItWorksJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "Gratis Castle — Free items in Nigeria | Give freely, receive gratefully" },
  description: "Nigeria's free community marketplace. Find useful things shared for free by neighbours, give away what you no longer need, and collect safely from our Lagos pickup hub or get it delivered free anywhere in Nigeria.",
  alternates: { canonical: "/" },
  keywords: ["free items Nigeria", "free stuff Lagos", "give away items Nigeria", "free marketplace Nigeria", "community marketplace Lagos", "free furniture Nigeria", "free electronics Lagos", "Gratis Castle"],
  other: {
    "geo.region": "NG",
    "geo.placename": "Nigeria",
  },
};

export default function Page() {
  return (
    <>
      <HomePage />
      <JsonLd data={howItWorksJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: "/" }])} />
    </>
  );
}
