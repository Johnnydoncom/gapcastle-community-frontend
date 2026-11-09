import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "Terms of service", description: CONTENT_PAGES["terms"].intro, alternates: { canonical: "/terms" } };

export default function Page() {
  return <ContentPage slug="terms" />;
}
