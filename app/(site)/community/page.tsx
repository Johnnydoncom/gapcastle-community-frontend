import type { Metadata } from "next";
import { Suspense } from "react";
import { CommunityPage, CommunitySkeleton } from "@/components/routes/community-page";

export const metadata: Metadata = {
  title: "Our community",
  description: "Small acts of giving, big community impact. Meet Gratis Castle.",
  alternates: { canonical: "/community" },
};

export default function Page() {
  return (
    <Suspense fallback={<CommunitySkeleton />}>
      <CommunityPage />
    </Suspense>
  );
}
