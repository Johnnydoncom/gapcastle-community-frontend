import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  SlidersHorizontal,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { Button } from "@/components/ui/button";
import { exploreHref, EXPLORE_PER_PAGE, type ExploreFilters } from "@/lib/explore";
import {
  CONDITION_LABELS,
  toListingRow,
  type ListingRow,
} from "@/lib/gapcastle";
import { AreaPicker } from "@/components/home/area-picker";
import { getCategories, getListings, getLocations } from "@/lib/server/api";
import { getVisitorArea } from "@/lib/server/area";
import { absoluteUrl, categoryPath, listingPath } from "@/lib/site";
import type { Category } from "@/lib/types";
import { RichHtml } from "@/components/rich-html";
import { JsonLd } from "@/components/seo/json-ld";

const CONDITIONS = Object.entries(CONDITION_LABELS).filter(([value]) =>
  ["brand_new", "like_new", "good", "fair", "needs_repair"].includes(value),
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
  // "Nearest first" ranks by distance from the visitor's area (chosen area, account, approximate location or Lagos).
  const area = filters.sort === "nearest" ? await getVisitorArea() : null;

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
      near_lga: area?.lgaId ?? undefined,
      near_state: area && !area.lgaId ? area.stateId ?? undefined : undefined,
      within: area && filters.within ? (filters.within as "lga" | "state") : undefined,
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
        <p className="text-xs text-muted-foreground">Only general areas are shown. Every handover goes through a Gratis Castle hub or free delivery.</p>
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
    <div className="container-page py-4 sm:py-8">
      {result && (
        <JsonLd data={listJsonLd(title, rows)} />
      )}

      <header className="relative isolate overflow-hidden rounded-3xl border border-border bg-card px-4 pb-4 pt-4 sm:px-8 sm:pb-7 sm:pt-6">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-20 size-64 rounded-full bg-accent blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 right-1/4 -z-20 size-48 rounded-full bg-highlight-soft blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 -z-20 h-40 w-56 bg-[radial-gradient(var(--color-primary-300)_1px,transparent_1px)] bg-[size:14px_14px] opacity-40 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        {fixedCategory?.image_url && (
          <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-[42%] md:block">
            <Image src={fixedCategory.image_url} alt="" fill sizes="42vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/75 to-card/10" />
          </div>
        )}

        <nav aria-label="Breadcrumb">
          <ol className="flex min-w-0 items-center gap-1 text-xs font-medium text-muted-foreground">
            <li><Link href="/" className="transition hover:text-foreground">Home</Link></li>
            <li aria-hidden><ChevronRight className="size-3" /></li>
            {fixedCategory ? (
              <>
                <li><Link href="/categories" className="transition hover:text-foreground">Categories</Link></li>
                <li aria-hidden><ChevronRight className="size-3" /></li>
                <li aria-current="page" className="truncate text-foreground">{fixedCategory.name}</li>
              </>
            ) : (
              <li aria-current="page" className="text-foreground">Explore</li>
            )}
          </ol>
        </nav>

        <div className="mt-4 min-w-0 sm:mt-5 md:max-w-[56%]">
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">{highlightFree(title)}</h1>
          {fixedCategory?.description ? (
            <RichHtml html={fixedCategory.description} className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base [&_h2]:text-foreground [&_h3]:text-foreground" />
          ) : (
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
          )}
        </div>

        <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold sm:mt-5" aria-label="Good to know">
          {meta && (
            <li className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-primary-foreground">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-highlight opacity-75 motion-reduce:hidden" />
                <span className="relative inline-flex size-2 rounded-full bg-highlight" />
              </span>
              {meta.total} item{meta.total === 1 ? "" : "s"} available
            </li>
          )}
          <li className="inline-flex items-center gap-1.5 rounded-full bg-highlight-soft px-3 py-1 text-highlight-soft-foreground">
            <Sparkles className="size-3.5" /> 100% free
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-muted-foreground">
            <Truck className="size-3.5" /> Hub pickup or free delivery
          </li>
        </ul>
      </header>

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

          {area && (
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm">
              <span className="text-muted-foreground">Closest to</span>
              <AreaPicker label={area.label} isGuess={area.source === "default" || area.source === "approximate"} />
              <span className="ml-auto flex flex-wrap gap-1.5" aria-label="Distance">
                <FilterPill href={href({ within: "" })} active={!filters.within}>Anywhere</FilterPill>
                <FilterPill href={href({ within: "state" })} active={filters.within === "state"}>My state</FilterPill>
                {area.lgaId && <FilterPill href={href({ within: "lga" })} active={filters.within === "lga"}>My LGA</FilterPill>}
              </span>
            </div>
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

/** Underlines the first "free" in a page title with a yellow highlighter swash. */
function highlightFree(title: string): ReactNode {
  const match = /\bfree\b/i.exec(title);
  if (!match) return title;

  const start = match.index;
  const end = start + match[0].length;

  return (
    <>
      {title.slice(0, start)}
      <span className="relative isolate whitespace-nowrap">
        <span aria-hidden className="absolute -inset-x-1 bottom-[0.08em] -z-10 h-[0.38em] -rotate-1 rounded-sm bg-highlight/80 dark:bg-highlight/35" />
        {title.slice(start, end)}
      </span>
      {title.slice(end)}
    </>
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

/** The items on this page of results. Breadcrumbs and the page type come from the route's PageJsonLd. */
function listJsonLd(title: string, rows: ListingRow[]) {
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
    ],
  };
}

export function ExploreSkeleton() {
  return (
    <div className="container-page py-8">
      <div className="h-40 w-full animate-pulse rounded-3xl bg-muted sm:h-48" />
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
