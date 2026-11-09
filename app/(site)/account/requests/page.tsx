import type { Metadata } from "next";
import { MyRequestsPage } from "@/components/account/requests-page";

export const metadata: Metadata = {
  title: "My requests",
  description: "Follow the items you've requested.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MyRequestsPage />;
}
