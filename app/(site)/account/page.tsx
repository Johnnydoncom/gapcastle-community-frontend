import type { Metadata } from "next";
import { AccountOverviewPage } from "@/components/account/overview-page";

export const metadata: Metadata = {
  title: "My account",
  description: "Your listings, requests and saved finds on Gratis Castle.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountOverviewPage />;
}
