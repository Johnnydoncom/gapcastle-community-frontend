import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { aboutPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "About Gratis Castle — Nigeria's free community marketplace",
  description: `${CONTENT_PAGES["about"].intro} Give freely, receive gratefully and build community across Nigeria.`,
  alternates: { canonical: "/about" },
  keywords: ["about Gratis Castle", "free marketplace Nigeria", "community marketplace", "give away items free", "Nigeria charity marketplace"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("about", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="about" />
      <PageJsonLd
        pageKey="about"
        data={[
          aboutPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "About", url: "/about" },
          ]),
        ]}
      />
    </>
  );
}
