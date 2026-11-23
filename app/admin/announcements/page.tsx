import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAnnouncementsPage } from "@/components/admin/management-pages";

export const metadata: Metadata = { title: "Announcements", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminAnnouncementsPage />
    </Suspense>
  );
}
