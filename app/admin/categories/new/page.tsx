import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCategoryEditorPage } from "@/components/admin/categories-admin";

export const metadata: Metadata = { title: "New category", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminCategoryEditorPage />
    </Suspense>
  );
}
