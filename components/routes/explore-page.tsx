import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { exploreHref, EXPLORE_PER_PAGE, type ExploreFilters } from "@/lib/explore";
import {
  CONDITION_LABELS,
  toListingRow,
  type ListingRow,
} from "@/lib/gapcastle";
import { getCategories, getListings, getLocations, getViewer } from "@/lib/server/api";
import { absoluteUrl, categoryPath, listingPath } from "@/lib/site";
import type { Category } from "@/lib/types";

const CONDITIONS = Object.entries(CONDITION_LABELS).filter(([value]) =>
  ["brand_new", "like_new", "good", "fair"].includes(value),
);

const SORTS = [
  ["newest", "Newest first"],
  ["nearest", "Nearest to me"],
  ["most_requested", "Most requested"],
] as const;

type Props = {
  basePath: string;
  filters: ExploreFilters;
  title: string;
  description: string;
  fixedCategory?: Category;
};

/**
 * Server-rendered browse page. Every filter is a normal link or a GET form, so
 * the results, categories and pagination are all crawlable without JavaScript.
 */
export async function ExplorePage({ basePath, filters, title, description, fixedCategory }: Props) {
  const viewer = filters.sort === "nearest" && !filters.location
    ? await getViewer().catch(() => null)
    : null;
  const near = filters.location || viewer?.data.location || "";

  const [categories, locations, result] = await Promise.all([
    fixedCategory
      ? Promise.resolve<Category[]>([])
      : getCategories().then((response) => response.data).catch(() => []),
    getLocations().then((response) => response.data).catch(() => []),
    getListings({
      q: filters.q || undefined,
      category: filters.category || undefined,
      location: filters.location || undefined,
      condition: filters.condition || undefined,
      fulfillment: filters.fulfillment || undefined,
      sort: filters.sort,
      near: near || undefined,
      page: filters.page,
      per_page: EXPLORE_PER_PAGE,
    }).catch(() => null),
  ]);

  const rows: ListingRow[] = result ? result.data.map(toListingRow) : [];
  const meta = result?.meta;
  const activeFilters = [
    filters.q,
    fixedCategory ? "" : filters.category,
    filters.location,
    filters.condition,
    filters.fulfillment,
  ].filter(Boolean).length;

  const href = (changes: Partial<ExploreFilters>) =>
    exploreHref(basePath, filters, changes, fixedCategory?.slug);

  const filterPanel = (
    <div className="space-y-6">
      {!fixedCategory && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">Category</p>
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            <FilterLink href={href({ category: "" })} active={!filters.category}>All categories</FilterLink>
            {categories.map((category) => (
              <FilterLink
                key={category.id}
                href={href({ category: filters.category === category.slug ? "" : category.slug })}
                active={filters.category === category.slug}
              >
                {category.name}
              </FilterLink>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Condition</p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(([value, label]) => (
            <FilterPill
              key={value}
              href={href({ condition: filters.condition === value ? "" : value })}
              active={filters.condition === value}
            >
              {label}
            </FilterPill>
          ))}
        </div>
      </div>


      <div className="space-y-1.5">
        <p className="text-sm font-semibold">Location</p>
        <details className="rounded-lg border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{filters.location || "Anywhere"}</span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          </summary>
          <div className="max-h-52 overflow-y-auto border-t border-border p-1.5">
            <FilterLink href={href({ location: "" })} active={!filters.location}>Anywhere</FilterLink>
            {filters.location && !locations.some((option) => option.value === filters.location) && (
              <FilterLink href={href({ location: "" })} active>{filters.location}</FilterLink>
            )}
            {locations.map((option) => (
              <FilterLink
                key={option.label}
                href={href({ location: filters.location === option.value ? "" : option.value })}
                active={filters.location === option.value}
              >
                {option.label} ({option.count})
              </FilterLink>
            ))}
          </div>
        </details>
        <p className="text-xs text-muted-foreground">Only general areas are shown. Every handover goes through a Gap Castle hub or waybill.</p>
      </div>

      {activeFilters > 0 && (
        <Button asChild variant="ghost" size="sm">
          <Link href={href({ q: "", category: "", location: "", condition: "", fulfillment: "" })} scroll={false}>
            <X className="size-3" /> Clear all filters
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <div className="container-page py-8">
      {result && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd(title, rows, fixedCategory)) }}
        />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {fixedCategory && (
            <Link href="/categories" className="text-sm font-semibold text-primary hover:underline">
              All categories
            </Link>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="highlight"><Link href="/give">Give an item</Link></Button>
      </div>

      <form action={basePath} method="get" role="search" className="mt-6 flex gap-3">
        {!fixedCategory && filters.category && <input type="hidden" name="category" value={filters.category} />}
        {filters.location && <input type="hidden" name="location" value={filters.location} />}
        {filters.condition && <input type="hidden" name="condition" value={filters.condition} />}
        {filters.fulfillment && <input type="hidden" name="fulfillment" value={filters.fulfillment} />}
        {filters.sort !== "newest" && <input type="hidden" name="sort" value={filters.sort} />}
        <Input
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search by item name or keyword"
          aria-label="Search items"
          className="h-11 flex-1"
        />
        <Button type="submit" className="h-11">
          <Search className="size-4" /> Search
        </Button>
      </form>

      <details className="group mt-4 rounded-2xl border border-border bg-card p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4" /> Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
          </span>
          <span className="text-sm font-normal text-muted-foreground group-open:hidden">Show</span>
          <span className="hidden text-sm font-normal text-muted-foreground group-open:inline">Hide</span>
        </summary>
        <div className="mt-5">{filterPanel}</div>
      </details>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-32 rounded-2xl border border-border bg-card p-5">{filterPanel}</div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {result
                ? `${meta?.total ?? 0} free item${meta?.total === 1 ? "" : "s"}`
                : "Unable to load items right now"}
            </p>
            <div className="flex flex-wrap gap-1.5" aria-label="Sort items">
              {SORTS.map(([value, label]) => (
                <FilterPill key={value} href={href({ sort: value })} active={filters.sort === value}>
                  {label}
                </FilterPill>
              ))}
            </div>
          </div>

          {filters.sort === "nearest" && !near && (
            <p className="mb-4 rounded-xl border border-border bg-cream px-4 py-3 text-sm text-muted-foreground">
              Choose a location to see the closest items first.
            </p>
          )}

          {!result ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold">We couldn&apos;t load free items</p>
              <p className="mt-1 text-sm text-muted-foreground">Please refresh the page to try again.</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-lg font-semibold">Nothing matches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Try fewer filters, or be the first to give something away.</p>
              <Button asChild className="mt-5" variant="highlight"><Link href="/give">Give an item</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {rows.map((item) => <ItemCard key={item.id} listing={item} />)}
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
              {meta.current_page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={href({ page: meta.current_page - 1 })} scroll={false} rel="prev">
                    <ChevronLeft className="size-4" /> Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled><ChevronLeft className="size-4" /> Previous</Button>
              )}
              <span className="text-sm text-muted-foreground">Page {meta.current_page} of {meta.last_page}</span>
              {meta.current_page < meta.last_page ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={href({ page: meta.current_page + 1 })} scroll={false} rel="next">
                    Next <ChevronRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>Next <ChevronRight className="size-4" /></Button>
              )}
            </nav>
          )}

          {!fixedCategory && categories.length > 0 && (
            <div className="mt-10">
              <p className="text-sm font-semibold">Browse categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <FilterPill key={category.id} href={categoryPath(category.slug)} active={false}>
                    {category.name}
                  </FilterPill>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={`block truncate rounded-md px-2 py-1.5 text-sm transition ${
        active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

function listJsonLd(title: string, rows: ListingRow[], category?: Category) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: title,
        numberOfItems: rows.length,
        itemListElement: rows.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: absoluteUrl(listingPath(item.slug)),
        })),
      },
      ...(category
        ? [{
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Categories", item: absoluteUrl("/categories") },
              { "@type": "ListItem", position: 3, name: category.name, item: absoluteUrl(categoryPath(category.slug)) },
            ],
          }]
        : []),
    ],
  };
}

export function ExploreSkeleton() {
  return (
    <div className="container-page py-8">
      <div className="h-9 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-11 w-full animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden h-80 animate-pulse rounded-2xl bg-muted lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
