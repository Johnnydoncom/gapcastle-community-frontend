import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { aboutPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "About Gratis Castle — Nigeria's free community marketplace",
  description: `${CONTENT_PAGES["about"].intro} Give freely, receive gratefully and build community across Nigeria.`,
  alternates: { canonical: "/about" },
  keywords: ["about Gratis Castle", "free marketplace Nigeria", "community marketplace", "give away items free", "Nigeria charity marketplace"],
};

export default function Page() {
  return (
    <>
      <ContentPage slug="about" />
      <JsonLd data={aboutPageJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "About", url: "/about" },
      ])} />
    </>
  );
}
