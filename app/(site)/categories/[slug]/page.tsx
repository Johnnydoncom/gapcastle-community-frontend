import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryPage } from "@/components/routes/categories-page";
import { ExploreSkeleton } from "@/components/routes/explore-page";
import { parseExploreFilters, type RawSearchParams } from "@/lib/explore";
import { ServerApiError, getCategory } from "@/lib/server/api";
import { categoryPath } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

const FALLBACK_IMAGE = "/brand/logo-lockup-768x553.png";

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: category } = await getCategory(slug);
    const canonical = categoryPath(category.slug || String(category.id));
    const description = category.description
      ?? `Browse free ${category.name.toLowerCase()} shared by neighbours on Gap Castle Community. Everything is free — take what you need, give what you don't.`;

    return {
      title: `Free ${category.name}`,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        url: canonical,
        title: `Free ${category.name} — Gap Castle Community`,
        description,
        images: category.image_url
          ? [{ url: category.image_url }]
          : [{ url: FALLBACK_IMAGE, width: 768, height: 553, alt: "Gap Castle Community" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `Free ${category.name} — Gap Castle Community`,
        description,
      },
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { title: "Category not found", robots: { index: false, follow: false } };
    }
    throw error;
  }
}

export default function Page({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      {Promise.all([params, searchParams]).then(([{ slug }, raw]) => (
        <CategoryPage slug={slug} filters={parseExploreFilters(raw, slug)} />
      ))}
    </Suspense>
  );
}
