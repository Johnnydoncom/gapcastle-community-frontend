import type { Metadata } from "next";
import { SettingsPage } from "@/components/account/settings-page";

export const metadata: Metadata = {
  title: "Profile settings",
  description: "Manage your profile, notifications and security.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SettingsPage />;
}
