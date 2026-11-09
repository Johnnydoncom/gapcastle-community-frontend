import type { Metadata } from "next";
import { EditListingPage } from "@/components/account/edit-listing-page";

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Update your free listing.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EditListingPage />;
}
