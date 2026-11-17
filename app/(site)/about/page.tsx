import type { Metadata } from "next";
import { ContentPage } from "@/components/content-page";
import { CONTENT_PAGES } from "@/lib/content";

export const metadata: Metadata = { title: "About Gratis Castle", description: CONTENT_PAGES["about"].intro, alternates: { canonical: "/about" } };

export default function Page() {
  return <ContentPage slug="about" />;
}
