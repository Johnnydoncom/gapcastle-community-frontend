import type { Metadata } from "next";
import { AdminSettingsPage } from "@/components/admin/settings-page";

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <AdminSettingsPage />;
}
