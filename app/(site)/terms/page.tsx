import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { CONTENT_PAGES } from "@/lib/content";

const baseMetadata: Metadata = { title: "Terms of service", description: CONTENT_PAGES["terms"].intro, alternates: { canonical: "/terms" } };

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("terms", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="terms" />
      <PageJsonLd
        pageKey="terms"
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Terms of service", url: "/terms" },
        ])}
      />
    </>
  );
}
