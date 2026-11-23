import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Community guidelines — Gratis Castle",
  description: `${CONTENT_PAGES["community-guidelines"].intro} Learn how to stay kind, safe and free on Nigeria's community marketplace.`,
  alternates: { canonical: "/community-guidelines" },
};

export default function Page() {
  return (
    <>
      <ContentPage slug="community-guidelines" />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Community guidelines", url: "/community-guidelines" },
      ])} />
    </>
  );
}
