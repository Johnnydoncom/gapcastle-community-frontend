import type { MetadataRoute } from "next";
import { backendUrl } from "@/lib/server/backend";
import { categoryPath, listingPath, profilePath, SITE_URL } from "@/lib/site";
import type { Category, Listing, Paginated } from "@/lib/types";

/** Static pages worth indexing. Filtered explore URLs canonicalise to /explore. */
const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/explore", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/give", changeFrequency: "monthly", priority: 0.6 },
  { path: "/pickup-hubs", changeFrequency: "weekly", priority: 0.7 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/community", changeFrequency: "monthly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/community-guidelines", changeFrequency: "yearly", priority: 0.4 },
  { path: "/safety", changeFrequency: "yearly", priority: 0.4 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/register", changeFrequency: "yearly", priority: 0.5 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

const SITEMAP_REVALIDATE_SECONDS = 3600;
const MAX_LISTING_PAGES = 80;
/** The browse endpoint caps `per_page` at 60. */
const LISTINGS_PER_PAGE = 60;

/** Fetch public data without requiring a member session; failures never break the sitemap. */
async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(backendUrl(path), {
      headers: { Accept: "application/json" },
      next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoryResponse, firstListingPage] = await Promise.all([
    apiGet<{ data: Category[] }>("categories"),
    apiGet<Paginated<Listing>>(`listings?available_only=1&per_page=${LISTINGS_PER_PAGE}&page=1`),
  ]);

  const categories = categoryResponse?.data ?? [];
  const listings: Listing[] = firstListingPage?.data ?? [];

  if (firstListingPage) {
    const lastPage = Math.min(firstListingPage.meta.last_page, MAX_LISTING_PAGES);

    for (let page = 2; page <= lastPage; page += 1) {
      const response = await apiGet<Paginated<Listing>>(
        `listings?available_only=1&per_page=${LISTINGS_PER_PAGE}&page=${page}`,
      );

      if (!response) {
        break;
      }

      listings.push(...response.data);
    }
  }

  const giverSlugs = Array.from(
    new Set(listings.map((listing) => listing.giver?.slug).filter((slug): slug is string => Boolean(slug))),
  );

  return [
    ...STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}${categoryPath(category.slug)}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...listings.map((listing) => ({
      url: `${SITE_URL}${listingPath(listing.slug)}`,
      lastModified: new Date(listing.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...giverSlugs.map((slug) => ({
      url: `${SITE_URL}${profilePath(slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
