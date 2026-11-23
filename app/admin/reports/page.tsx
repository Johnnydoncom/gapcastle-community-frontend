import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminReportsPage } from "@/components/admin/community-admin";

export const metadata: Metadata = { title: "Reports", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminReportsPage />
    </Suspense>
  );
}
