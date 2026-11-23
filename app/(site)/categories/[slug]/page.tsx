import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryPage } from "@/components/routes/categories-page";
import { ExploreSkeleton } from "@/components/routes/explore-page";
import { JsonLd } from "@/components/seo/json-ld";
import { parseExploreFilters, type RawSearchParams } from "@/lib/explore";
import { collectionPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";
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
    const plain = category.description_text?.replace(/\s+/g, " ").trim();
    const description = (plain ? (plain.length > 160 ? `${plain.slice(0, 157).trimEnd()}…` : plain) : null)
      ?? `Browse free ${category.name.toLowerCase()} shared by neighbours on Gratis Castle. Everything is free — take what you need, give what you don't. Available across Nigeria.`;

    return {
      title: `Free ${category.name} in Nigeria`,
      description,
      alternates: { canonical },
      keywords: [`free ${category.name.toLowerCase()} Nigeria`, `free ${category.name.toLowerCase()} Lagos`, `${category.name.toLowerCase()} giveaway`, "Gratis Castle"],
      openGraph: {
        type: "website",
        url: canonical,
        title: `Free ${category.name} — Gratis Castle`,
        description,
        images: category.image_url
          ? [{ url: category.image_url }]
          : [{ url: FALLBACK_IMAGE, width: 768, height: 553, alt: "Gratis Castle" }],
      },
      twitter: {
        card: "summary_large_image",
        title: `Free ${category.name} — Gratis Castle`,
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
    <>
      <Suspense fallback={<ExploreSkeleton />}>
        {Promise.all([params, searchParams]).then(([{ slug }, raw]) => (
          <CategoryPageWithJsonLd slug={slug} filters={parseExploreFilters(raw, slug)} />
        ))}
      </Suspense>
    </>
  );
}

async function CategoryPageWithJsonLd({ slug, filters }: { slug: string; filters: ReturnType<typeof parseExploreFilters> }) {
  let categoryName = slug;
  try {
    const { data: category } = await getCategory(slug);
    categoryName = category.name;
  } catch {
    // Fall through with slug as name
  }

  return (
    <>
      <CategoryPage slug={slug} filters={filters} />
      <JsonLd data={collectionPageJsonLd({
        name: `Free ${categoryName}`,
        description: `Browse free ${categoryName.toLowerCase()} on Gratis Castle — Nigeria's free community marketplace.`,
        url: categoryPath(slug),
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Categories", url: "/categories" },
        { name: categoryName, url: categoryPath(slug) },
      ])} />
    </>
  );
}
