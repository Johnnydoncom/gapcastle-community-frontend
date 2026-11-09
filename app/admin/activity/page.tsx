import type { Metadata } from "next";
import { AdminActivityPage } from "@/components/admin/management-pages";

export const metadata: Metadata = {
  title: "Activity",
  description: "Recent platform activity.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminActivityPage />;
}
