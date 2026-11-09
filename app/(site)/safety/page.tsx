import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "Safety guidelines", description: CONTENT_PAGES["safety"].intro, alternates: { canonical: "/safety" } };

export default function Page() {
  return <ContentPage slug="safety" />;
}
