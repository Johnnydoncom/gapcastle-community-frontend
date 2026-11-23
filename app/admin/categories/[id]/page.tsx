import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCategoryEditorPage } from "@/components/admin/categories-admin";

export const metadata: Metadata = { title: "Edit category", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <AdminCategoryEditorPage categoryId={id} />
    </Suspense>
  );
}
