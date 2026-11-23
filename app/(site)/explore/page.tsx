import type { Metadata } from "next";
import { Suspense } from "react";
import { ExplorePage, ExploreSkeleton } from "@/components/routes/explore-page";
import { JsonLd } from "@/components/seo/json-ld";
import { parseExploreFilters, type RawSearchParams } from "@/lib/explore";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
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
      <JsonLd data={collectionPageJsonLd({
        name: "Explore free items in Nigeria",
        description: "Browse free items shared by your community across Nigeria. Everything is free on Gratis Castle.",
        url: "/explore",
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Explore", url: "/explore" },
      ])} />
    </>
  );
}
