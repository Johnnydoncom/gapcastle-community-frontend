import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { howItWorksJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "How Gratis Castle works — Give & receive free items in Nigeria",
  description: `${CONTENT_PAGES["how-it-works"].intro} Pickup hub in Lagos, free delivery across Nigeria.`,
  alternates: { canonical: "/how-it-works" },
  keywords: ["how Gratis Castle works", "free items Nigeria how to", "pickup hubs Lagos", "free delivery Nigeria", "give items free"],
};

export default function Page() {
  return (
    <>
      <ContentPage slug="how-it-works" />
      <JsonLd data={howItWorksJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "How it works", url: "/how-it-works" },
      ])} />
    </>
  );
}
