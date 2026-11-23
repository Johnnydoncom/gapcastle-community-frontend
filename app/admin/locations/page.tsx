import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLocationsPage } from "@/components/admin/geography-admin";

export const metadata: Metadata = { title: "Pickup hubs", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLocationsPage />
    </Suspense>
  );
}
