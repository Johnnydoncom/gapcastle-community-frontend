import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Community guidelines — Gratis Castle",
  description: `${CONTENT_PAGES["community-guidelines"].intro} Learn how to stay kind, safe and free on Nigeria's community marketplace.`,
  alternates: { canonical: "/community-guidelines" },
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("community-guidelines", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="community-guidelines" />
      <PageJsonLd
        pageKey="community-guidelines"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Community guidelines", url: "/community-guidelines" },
          ]),
        ]}
      />
    </>
  );
}
