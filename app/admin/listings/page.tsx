import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminListingsPage } from "@/components/admin/listings-admin-page";

export const metadata: Metadata = { title: "Listings" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminListingsPage />
    </Suspense>
  );
}
