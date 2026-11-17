import type { Metadata } from "next";
import { NotificationsPage } from "@/components/account/notifications-page";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Keep up with requests, messages, and activity in your Gratis Castle community.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <NotificationsPage />;
}
