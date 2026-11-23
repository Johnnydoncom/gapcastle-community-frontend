import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { GivePage } from "@/components/routes/give-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Give an item — Share free items with your community",
  description: "List something you no longer need and give it a new home in Nigeria. Free, simple and meaningful. No selling — just giving.",
  alternates: { canonical: "/give" },
  keywords: ["give away items free Nigeria", "donate items Lagos", "share free stuff Nigeria", "list free items", "declutter give away"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("give", baseMetadata);
}

export default function Page() {
  return (
    <>
      <GivePage />
      <PageJsonLd
        pageKey="give"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Give an item", url: "/give" },
          ]),
        ]}
      />
    </>
  );
}
