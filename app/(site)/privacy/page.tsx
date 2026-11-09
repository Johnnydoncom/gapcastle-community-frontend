import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy policy", description: CONTENT_PAGES["privacy"].intro, alternates: { canonical: "/privacy" } };

export default function Page() {
  return <ContentPage slug="privacy" />;
}
