import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminReviewsPage } from "@/components/admin/community-admin";

export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminReviewsPage />
    </Suspense>
  );
}
