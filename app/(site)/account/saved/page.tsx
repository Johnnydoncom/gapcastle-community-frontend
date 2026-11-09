import type { Metadata } from "next";
import { SavedPage } from "@/components/account/saved-page";

export const metadata: Metadata = {
  title: "Saved items",
  description: "Items you've saved for later.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SavedPage />;
}
