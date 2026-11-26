import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { faqJsonLdFromContent, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "FAQs — Free items marketplace Nigeria",
  description: `${CONTENT_PAGES["faq"].intro} Learn how Gratis Castle works, our free Lagos pickup hub, delivery across Nigeria and more.`,
  alternates: { canonical: "/faq" },
  keywords: ["Gratis Castle FAQ", "free items FAQ Nigeria", "how Gratis Castle works", "pickup hubs Lagos", "free marketplace questions"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("faq", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="faq" />
      <PageJsonLd
        pageKey="faq"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "FAQs", url: "/faq" },
          ]),
        ]}
        contentData={faqJsonLdFromContent(CONTENT_PAGES["faq"])}
        faqFromCustomContent
      />
    </>
  );
}
