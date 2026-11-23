import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Safety guidelines — Stay safe on Gratis Castle",
  description: `${CONTENT_PAGES["safety"].intro} Tips for giving and receiving free items safely in Nigeria.`,
  alternates: { canonical: "/safety" },
  keywords: ["Gratis Castle safety", "safe giving Nigeria", "pickup hub safety Lagos", "free items safety tips"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("safety", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="safety" />
      <PageJsonLd
        pageKey="safety"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Safety guidelines", url: "/safety" },
          ]),
        ]}
      />
    </>
  );
}
