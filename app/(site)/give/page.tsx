import type { Metadata } from "next";
import { GivePage } from "@/components/routes/give-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Give an item — Share free items with your community",
  description: "List something you no longer need and give it a new home in Nigeria. Free, simple and meaningful. No selling — just giving.",
  alternates: { canonical: "/give" },
  keywords: ["give away items free Nigeria", "donate items Lagos", "share free stuff Nigeria", "list free items", "declutter give away"],
};

export default function Page() {
  return (
    <>
      <GivePage />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Give an item", url: "/give" },
      ])} />
    </>
  );
}
