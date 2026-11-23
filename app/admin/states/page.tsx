import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminStatesPage } from "@/components/admin/geography-admin";

export const metadata: Metadata = { title: "States", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminStatesPage />
    </Suspense>
  );
}
