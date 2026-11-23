import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { JsonLd } from "@/components/seo/json-ld";
import { CONTENT_PAGES } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Safety guidelines — Stay safe on Gratis Castle",
  description: `${CONTENT_PAGES["safety"].intro} Tips for giving and receiving free items safely in Nigeria.`,
  alternates: { canonical: "/safety" },
  keywords: ["Gratis Castle safety", "safe giving Nigeria", "pickup hub safety Lagos", "free items safety tips"],
};

export default function Page() {
  return (
    <>
      <ContentPage slug="safety" />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Safety guidelines", url: "/safety" },
      ])} />
    </>
  );
}
