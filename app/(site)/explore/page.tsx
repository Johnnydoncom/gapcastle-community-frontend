import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { Suspense } from "react";
import { ExplorePage, ExploreSkeleton } from "@/components/routes/explore-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { parseExploreFilters, type RawSearchParams } from "@/lib/explore";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Explore free items in Nigeria",
  description: "Browse free items shared by your community across Nigeria — furniture, electronics, clothes, books, baby items and more. Everything is free on Gratis Castle.",
  alternates: { canonical: "/explore" },
  keywords: ["free items Nigeria", "free furniture Lagos", "free electronics Nigeria", "free clothes Nigeria", "free books Lagos", "browse free items", "Gratis Castle explore"],
  openGraph: {
    type: "website",
    url: "/explore",
    title: "Explore free items in Nigeria — Gratis Castle",
    description: "Browse free items shared by your community — furniture, electronics, clothes, books and more. 100% free.",
  },
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("explore", baseMetadata);
}

type Props = {
  searchParams: Promise<RawSearchParams>;
};

export default function Page({ searchParams }: Props) {
  return (
    <>
      <Suspense fallback={<ExploreSkeleton />}>
        {searchParams.then((raw) => (
          <ExplorePage
            basePath="/explore"
            filters={parseExploreFilters(raw)}
            title="Explore free items"
            description="Everything here is free — take what you need, give what you don't."
          />
        ))}
      </Suspense>
      <PageJsonLd
        pageKey="explore"
        data={[
          collectionPageJsonLd({
            name: "Explore free items in Nigeria",
            description: "Browse free items shared by your community across Nigeria. Everything is free on Gratis Castle.",
            url: "/explore",
          }),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Explore", url: "/explore" },
          ]),
        ]}
      />
    </>
  );
}
