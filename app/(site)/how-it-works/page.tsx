import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "How it works", description: CONTENT_PAGES["how-it-works"].intro, alternates: { canonical: "/how-it-works" } };

export default function Page() {
  return <ContentPage slug="how-it-works" />;
}
