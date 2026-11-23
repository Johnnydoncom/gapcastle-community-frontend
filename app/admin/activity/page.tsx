import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminActivityPage } from "@/components/admin/management-pages";

export const metadata: Metadata = { title: "Activity log", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminActivityPage />
    </Suspense>
  );
}
