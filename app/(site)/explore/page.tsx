import type { Metadata } from "next";
import { Suspense } from "react";
import { ExplorePage, ExploreSkeleton } from "@/components/routes/explore-page";
import { parseExploreFilters, type RawSearchParams } from "@/lib/explore";

export const metadata: Metadata = {
  title: "Explore free items",
  description: "Browse free items shared by your community — furniture, electronics, clothes, books and more.",
  alternates: { canonical: "/explore" },
  openGraph: {
    type: "website",
    url: "/explore",
    title: "Explore free items — Gap Castle Community",
    description: "Browse free items shared by your community — furniture, electronics, clothes, books and more.",
  },
};

type Props = {
  searchParams: Promise<RawSearchParams>;
};

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      {searchParams.then((raw) => (
        <ExplorePage
          basePath="/explore"
          filters={parseExploreFilters(raw)}
          title="Explore free items"
          description="Everything here is free — take what you need, give what you don't."
        />
      ))}
    </Suspense>
  );
}
