import type { Metadata } from "next";
import { Suspense } from "react";
import { MyListingsPage } from "@/components/account/listings-page";

export const metadata: Metadata = {
  title: "My listings",
  description: "Manage the items you're giving away.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <MyListingsPage />
    </Suspense>
  );
}
