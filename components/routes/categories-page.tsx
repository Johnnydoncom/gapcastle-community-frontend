import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Package } from "lucide-react";
import { ExplorePage } from "@/components/routes/explore-page";
import { Button } from "@/components/ui/button";
import type { ExploreFilters } from "@/lib/explore";
import { categoryIcon } from "@/lib/gapcastle";
import { ServerApiError, getCategories, getCategory } from "@/lib/server/api";
import { absoluteUrl, categoryPath } from "@/lib/site";
import type { Category } from "@/lib/types";

/** /categories — every category with its count of free items. */
export async function CategoriesPage() {
  const categories = await getCategories()
    .then((response) => response.data)
    .catch(() => []);

  return (
    <div className="container-page py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                name: "Browse categories",
                url: absoluteUrl("/categories"),
                description: "Find free furniture, electronics, clothing, books, baby items and more by category.",
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                  { "@type": "ListItem", position: 2, name: "Categories", item: absoluteUrl("/categories") },
                ],
              },
              {
                "@type": "ItemList",
                numberOfItems: categories.length,
                itemListElement: categories.map((category, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  name: category.name,
                  url: absoluteUrl(categoryPath(category.slug)),
                })),
              },
            ],
          }),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground" aria-current="page">Categories</span>
      </nav>

      <p className="text-sm font-semibold text-primary">Browse by category</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">What are you looking for?</h1>
      <p className="mt-1 text-muted-foreground">Everything here is free — take what you need, give what you don&apos;t.</p>

      {categories.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Categories are taking a moment to load</p>
          <p className="mt-1 text-sm text-muted-foreground">Please refresh the page, or browse everything available.</p>
          <Button asChild className="mt-5"><Link href="/explore">Explore all items</Link></Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = categoryIcon(category.icon);
            return (
              <Link
                key={category.id}
                href={categoryPath(category.slug)}
                className="group relative isolate flex h-44 flex-col justify-end overflow-hidden rounded-2xl border border-border bg-foreground p-5 text-background shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- category artwork is configured in the API */}
                {category.image_url && <img src={category.image_url} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/90 via-foreground/50 to-foreground/10" />
                <span className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-xl bg-background/95 text-primary"><Icon className="size-5" /></span>
                <span className="text-lg font-bold">{category.name}</span>
                <span className="mt-0.5 flex items-center justify-between text-sm text-background/80">
                  {category.available_count ?? 0} free item{category.available_count === 1 ? "" : "s"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Skeleton shown while the category grid streams in. */
export function CategoriesSkeleton() {
  return (
    <div className="container-page py-8">
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-9 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-44 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

/** /categories/[slug] — the explore page with the category fixed. */
export async function CategoryPage({ slug, filters }: { slug: string; filters: ExploreFilters }) {
  let category: Category;

  try {
    category = (await getCategory(slug)).data;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <ExplorePage
      basePath={categoryPath(category.slug)}
      filters={{ ...filters, category: category.slug }}
      fixedCategory={category}
      title={`Free ${category.name}`}
      description={category.description ?? "Everything here is free — take what you need, give what you don't."}
    />
  );
}
