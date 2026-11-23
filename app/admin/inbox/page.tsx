import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminInboxPage } from "@/components/admin/community-admin";

export const metadata: Metadata = { title: "Contact inbox", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminInboxPage />
    </Suspense>
  );
}
