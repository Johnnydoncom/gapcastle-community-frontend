import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "Community guidelines", description: CONTENT_PAGES["community-guidelines"].intro, alternates: { canonical: "/community-guidelines" } };

export default function Page() {
  return <ContentPage slug="community-guidelines" />;
}
