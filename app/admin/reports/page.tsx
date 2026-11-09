import type { Metadata } from "next";
import { AdminReportsPage } from "@/components/admin/moderation-pages";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review member reports.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminReportsPage />;
}
