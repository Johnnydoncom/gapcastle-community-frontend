import type { Metadata } from "next";
import { AdminOverviewPage } from "@/components/admin/overview-page";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Community health at a glance.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminOverviewPage />;
}
