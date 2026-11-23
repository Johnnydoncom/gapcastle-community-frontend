import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { faqJsonLdFromContent, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQs — Free items marketplace Nigeria",
  description: `${CONTENT_PAGES["faq"].intro} Learn how Gratis Castle works, our Lagos pickup hub, free delivery across Nigeria and more.`,
  alternates: { canonical: "/faq" },
  keywords: ["Gratis Castle FAQ", "free items FAQ Nigeria", "how Gratis Castle works", "pickup hubs Lagos", "free marketplace questions"],
};

export default function Page() {
  return (
    <>
      <ContentPage slug="faq" />
      <JsonLd data={faqJsonLdFromContent(CONTENT_PAGES["faq"])} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "FAQs", url: "/faq" },
      ])} />
    </>
  );
}
