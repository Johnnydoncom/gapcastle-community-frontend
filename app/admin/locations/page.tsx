import type { Metadata } from "next";
import { AdminLocationsPage } from "@/components/admin/locations-page";

export const metadata: Metadata = {
  title: "Pickup locations",
  description: "Manage Nigerian states and Gap Castle pickup hubs.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLocationsPage />;
}
