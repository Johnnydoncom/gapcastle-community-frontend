/** Shared types and URL helpers for the explore and category listing pages. */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export type ExploreFilters = {
  q: string;
  category: string;
  location: string;
  condition: string;
  fulfillment: string;
  sort: string;
  page: number;
};

export const DEFAULT_EXPLORE_SORT = "newest";
export const EXPLORE_PER_PAGE = 18;

/** Values accepted by the browse endpoint, used to sanitise public query strings. */
const SORTS = ["newest", "oldest", "nearest", "most_requested"];
const CONDITIONS = ["brand_new", "like_new", "good", "fair"];
const FULFILLMENTS = ["pickup", "delivery"];

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function oneOf(value: string, allowed: string[], fallback = ""): string {
  return allowed.includes(value) ? value : fallback;
}

/** Read the explore filters from a page's searchParams promise value. */
export function parseExploreFilters(raw: RawSearchParams, fixedCategory?: string): ExploreFilters {
  const requestedPage = Number.parseInt(firstParam(raw.page), 10);

  return {
    q: firstParam(raw.q).trim().slice(0, 100),
    category: fixedCategory ?? firstParam(raw.category).trim(),
    location: firstParam(raw.location).trim().slice(0, 120),
    condition: oneOf(firstParam(raw.condition).trim(), CONDITIONS),
    fulfillment: oneOf(firstParam(raw.fulfillment).trim(), FULFILLMENTS),
    sort: oneOf(firstParam(raw.sort).trim(), SORTS, DEFAULT_EXPLORE_SORT),
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
  };
}

/**
 * Build a crawlable explore URL. Changing any filter resets pagination unless a
 * new page is supplied explicitly. Fixed-category routes keep the category in
 * the path instead of duplicating it as a query parameter.
 */
export function exploreHref(
  basePath: string,
  filters: ExploreFilters,
  changes: Partial<ExploreFilters> = {},
  fixedCategory?: string,
): string {
  const next = { ...filters, ...changes };
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (!fixedCategory && next.category) params.set("category", next.category);
  if (next.location) params.set("location", next.location);
  if (next.condition) params.set("condition", next.condition);
  if (next.fulfillment) params.set("fulfillment", next.fulfillment);
  if (next.sort && next.sort !== DEFAULT_EXPLORE_SORT) params.set("sort", next.sort);

  const page = changes.page ?? 1;
  if (page > 1) params.set("page", String(page));

  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}
