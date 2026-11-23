import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContentPage } from "@/components/content-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { CONTENT_PAGES } from "@/lib/content";

const baseMetadata: Metadata = { title: "Privacy policy", description: CONTENT_PAGES["privacy"].intro, alternates: { canonical: "/privacy" } };

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("privacy", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContentPage slug="privacy" />
      <PageJsonLd
        pageKey="privacy"
        data={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Privacy policy", url: "/privacy" },
        ])}
      />
    </>
  );
}
