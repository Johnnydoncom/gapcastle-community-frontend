import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "FAQs", description: CONTENT_PAGES["faq"].intro, alternates: { canonical: "/faq" } };

export default function Page() {
  return <ContentPage slug="faq" />;
}
