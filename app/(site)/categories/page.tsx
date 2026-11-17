import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoriesPage, CategoriesSkeleton } from "@/components/routes/categories-page";

export const metadata: Metadata = {
  title: "Browse categories",
  description: "Find free furniture, electronics, clothing, books, baby items and more by category.",
  alternates: { canonical: "/categories" },
  openGraph: {
    type: "website",
    url: "/categories",
    title: "Browse categories — Gratis Castle",
    description: "Find free furniture, electronics, clothing, books, baby items and more by category.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesPage />
    </Suspense>
  );
}
