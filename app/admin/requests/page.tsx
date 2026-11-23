import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminRequestsPage } from "@/components/admin/requests-admin-page";

export const metadata: Metadata = { title: "Orders" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminRequestsPage />
    </Suspense>
  );
}
