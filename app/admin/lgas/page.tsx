import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLgasPage } from "@/components/admin/geography-admin";

export const metadata: Metadata = { title: "LGAs", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLgasPage />
    </Suspense>
  );
}
