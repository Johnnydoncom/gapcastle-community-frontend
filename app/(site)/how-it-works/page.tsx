import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { howItWorksJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "How Gratis Castle works — Give & receive free items in Nigeria",
  description: `${CONTENT_PAGES["how-it-works"].intro} Free pickup at our Lagos hub, or delivery across Nigeria at your cost.`,
  alternates: { canonical: "/how-it-works" },
  keywords: ["how Gratis Castle works", "free items Nigeria how to", "pickup hubs Lagos", "item delivery Nigeria", "give items free"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("how-it-works", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="how-it-works" />
      <PageJsonLd
        pageKey="how-it-works"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "How it works", url: "/how-it-works" },
          ]),
        ]}
        contentData={howItWorksJsonLd()}
      />
    </>
  );
}
