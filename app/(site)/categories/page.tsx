import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoriesPage, CategoriesSkeleton } from "@/components/routes/categories-page";
import { JsonLd } from "@/components/seo/json-ld";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
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

export default function Page() {
  return (
    <>
      <Suspense fallback={<CategoriesSkeleton />}>
        <CategoriesPage />
      </Suspense>
      <JsonLd data={collectionPageJsonLd({
        name: "Free item categories",
        description: "Browse free items by category on Gratis Castle — Nigeria's free community marketplace.",
        url: "/categories",
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Categories", url: "/categories" },
      ])} />
    </>
  );
}
