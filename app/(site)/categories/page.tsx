import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { Suspense } from "react";
import { CategoriesPage, CategoriesSkeleton } from "@/components/routes/categories-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Browse categories — Free items by category in Nigeria",
  description: "Find free furniture, electronics, clothing, books, baby items and more by category on Gratis Castle. Nigeria's free community marketplace.",
  alternates: { canonical: "/categories" },
  keywords: ["free items categories Nigeria", "free furniture", "free electronics Lagos", "free clothing Nigeria", "free books", "free baby items", "Gratis Castle categories"],
  openGraph: {
    type: "website",
    url: "/categories",
    title: "Browse categories — Gratis Castle",
    description: "Find free furniture, electronics, clothing, books, baby items and more by category.",
  },
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("categories", baseMetadata);
}

export default function Page() {
  return (
    <>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesPage />
      </Suspense>
      <PageJsonLd
        pageKey="categories"
        data={[
          collectionPageJsonLd({
            name: "Free item categories",
            description: "Browse free items by category on Gratis Castle — Nigeria's free community marketplace.",
            url: "/categories",
          }),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
          ]),
        ]}
      />
    </>
  );
}
