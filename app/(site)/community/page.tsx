import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { Suspense } from "react";
import { CommunityPage, CommunitySkeleton } from "@/components/routes/community-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Our community — Free giving community in Nigeria",
  description: "Small acts of giving, big community impact. Join Gratis Castle — neighbours giving away useful items for free across Nigeria.",
  alternates: { canonical: "/community" },
  keywords: ["Gratis Castle community", "free giving Nigeria", "community marketplace Lagos", "give away items Nigeria", "neighbours helping neighbours"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("community", baseMetadata);
}

export default function Page() {
  return (
    <>
      <Suspense fallback={<CommunitySkeleton />}>
        <CommunityPage />
      </Suspense>
      <PageJsonLd
        pageKey="community"
        data={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Community", url: "/community" },
          ]),
        ]}
      />
    </>
  );
}
