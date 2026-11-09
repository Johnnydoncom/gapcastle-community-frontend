import type { Metadata } from "next";
import { AdminAnnouncementsPage } from "@/components/admin/management-pages";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Publish community announcements.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminAnnouncementsPage />;
}
