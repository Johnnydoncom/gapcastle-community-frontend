import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCategoriesPage } from "@/components/admin/categories-admin";

export const metadata: Metadata = { title: "Categories", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminCategoriesPage />
    </Suspense>
  );
}
