import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityPage, CommunitySkeleton } from "@/components/routes/community-page";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Our community — Free giving community in Nigeria",
  description: "Small acts of giving, big community impact. Join Gratis Castle — neighbours giving away useful items for free across Nigeria.",
  alternates: { canonical: "/community" },
  keywords: ["Gratis Castle community", "free giving Nigeria", "community marketplace Lagos", "give away items Nigeria", "neighbours helping neighbours"],
};

export default function Page() {
  return (
    <>
      <Suspense fallback={<CommunitySkeleton />}>
        <CommunityPage />
      </Suspense>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Community", url: "/community" },
      ])} />
    </>
  );
}
