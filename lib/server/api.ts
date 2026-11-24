import "server-only";

import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { BACKEND_TIMEOUT_MS, SESSION_COOKIE, backendUrl } from "./backend";
import type {
  Account,
  Announcement,
  Category,
  CommunityStats,
  Listing,
  LocationOption,
  NgState,
  Paginated,
  PublicProfile,
  Review,
  SiteInfo,
} from "@/lib/types";

type QueryValue = string | number | boolean | string[] | null | undefined;
export type ServerQuery = Record<string, QueryValue>;

export class ServerApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

type RequestOptions = {
  /** Send the member's session token so owner-only fields and is_saved are accurate. */
  authenticated?: boolean;
};

function queryString(query?: ServerQuery): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : value === true ? "1" : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function apiError(status: number): ServerApiError {
  return new ServerApiError(status, status === 404 ? "Not found" : "The community service is unavailable.");
}

/**
 * Request-time data (listings, profiles, the viewer). Never stored in a shared cache, because
 * it can depend on who is asking. React `cache()` dedupes repeat calls within one render.
 */
const requestGet = cache(async (path: string, search: string, authenticated: boolean): Promise<unknown> => {
  const headers = new Headers({ Accept: "application/json" });

  if (authenticated) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  // A hard timeout: a slow API must not keep a Vercel function (and its billed memory) waiting.
  const response = await fetch(`${backendUrl(path)}${search}`, { headers, cache: "no-store", signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) }).catch(() => {
    throw apiError(504);
  });

  if (!response.ok) {
    throw apiError(response.status);
  }

  return response.json();
});

async function serverGet<T>(path: string, query?: ServerQuery, options: RequestOptions = {}): Promise<T> {
  return (await requestGet(path, queryString(query), options.authenticated ?? true)) as T;
}

/*
 * Shared public data
 * ------------------
 * Everything below is the same for every visitor, so it is fetched WITHOUT the member's token
 * and kept in one shared `use cache` entry per URL. That keeps Vercel usage flat:
 *   - no per-member copies (a token in the request used to create one cache entry per member),
 *   - no fetch Data Cache writes (each one is billed as an ISR write on Vercel),
 *   - pages whose static shell uses this data regenerate at most hourly instead of every minute.
 * Admin edits still show up straight away: the API calls /api/revalidate with these tags
 * whenever the underlying records change (see the backend's App\Support\FrontendCache).
 */

/** Cache tags shared with the backend's FrontendCache purge list. Keep the two in sync. */
export const CACHE_TAGS = {
  categories: "categories",
  locations: "locations",
  states: "states",
  stats: "stats",
  announcements: "announcements",
  siteInfo: "site-info",
  reviews: "reviews",
  seoPages: "seo-pages",
} as const;

type PublicResult = { ok: true; body: unknown } | { ok: false; status: number };

/**
 * One public GET. Failures are returned (not thrown) so they can be given a short cache life:
 * a backend hiccup must never be stored for an hour.
 */
async function publicFetch(path: string, search = ""): Promise<PublicResult> {
  try {
    const response = await fetch(`${backendUrl(path)}${search}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS) });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, body: await response.json() };
  } catch {
    return { ok: false, status: 503 };
  }
}

/** Unwrap a cached public result, throwing the same ServerApiError callers already handle. */
async function unwrap<T>(result: Promise<PublicResult>): Promise<T> {
  const value = await result;
  if (!value.ok) throw apiError(value.status);
  return value.body as T;
}

/** Call inside a `use cache` scope: an hour for good answers, 30 seconds for failures (404 counts as an answer). */
function lifeFor(result: PublicResult): PublicResult {
  if (!result.ok && result.status !== 404) {
    cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  } else {
    cacheLife("hours");
  }
  return result;
}

async function cachedCategories(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  return lifeFor(await publicFetch("categories"));
}

async function cachedCategory(slug: string): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  return lifeFor(await publicFetch(`categories/${encodeURIComponent(slug)}`));
}

async function cachedLocations(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.locations);
  return lifeFor(await publicFetch("listings/locations"));
}

async function cachedStates(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.states);
  return lifeFor(await publicFetch("states"));
}

async function cachedStats(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.stats);
  return lifeFor(await publicFetch("stats"));
}

async function cachedAnnouncements(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.announcements);
  return lifeFor(await publicFetch("announcements"));
}

async function cachedSiteInfo(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.siteInfo);
  return lifeFor(await publicFetch("site-info"));
}

async function cachedReviews(): Promise<PublicResult> {
  "use cache";
  cacheTag(CACHE_TAGS.reviews);
  return lifeFor(await publicFetch("reviews"));
}

/**
 * Nearest LGA to a point. Vercel's IP location is city-level, so the point is rounded to ~1 km
 * and the answer kept for a week: a handful of entries cover the whole country.
 */
async function cachedLocate(lat: string, lng: string): Promise<PublicResult> {
  "use cache";
  const result = await publicFetch("locate", `?lat=${lat}&lng=${lng}`);
  if (!result.ok && result.status !== 404) {
    cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  } else {
    cacheLife("weeks");
  }
  return result;
}

export type ListingQuery = {
  q?: string;
  category?: string;
  location?: string;
  condition?: string;
  fulfillment?: string;
  sort?: string;
  near?: string;
  /** "Near me": the visitor's LGA (preferred) or state id. */
  near_lga?: number | null;
  near_state?: number | null;
  /** Limit to the visitor's LGA or state. */
  within?: "lga" | "state" | "any";
  available_only?: boolean;
  include_given?: boolean;
  page?: number;
  per_page?: number;
};

export function getListings(query: ListingQuery = {}): Promise<Paginated<Listing>> {
  return serverGet<Paginated<Listing>>("listings", query);
}

export function getListing(slug: string, authenticated = true): Promise<{ data: Listing }> {
  return serverGet<{ data: Listing }>(`listings/${encodeURIComponent(slug)}`, undefined, { authenticated });
}

export function getRelatedListings(listingId: number): Promise<{ data: Listing[] }> {
  return serverGet<{ data: Listing[] }>(`listings/${listingId}/related`);
}

export function getCategories(): Promise<{ data: Category[] }> {
  return unwrap(cachedCategories());
}

export function getCategory(slug: string): Promise<{ data: Category }> {
  return unwrap(cachedCategory(slug));
}

export function getProfile(slug: string): Promise<{
  data: PublicProfile;
  listings: Listing[];
  meta: { is_blocked: boolean; is_self: boolean };
}> {
  return serverGet(`users/${encodeURIComponent(slug)}`);
}

export function getLocations(): Promise<{ data: LocationOption[] }> {
  return unwrap(cachedLocations());
}

/** Nigerian states with their active pickup hubs (public, shared cache). */
export function getStates(): Promise<{ data: NgState[] }> {
  return unwrap(cachedStates());
}

export type LocateResult = { lga: { id: number; name: string; slug: string }; state: { id: number; name: string; slug: string } };

/** Nearest LGA to a point. Used only to turn an approximate position into an area; the point is not stored. */
export function locateArea(lat: number, lng: number): Promise<{ data: LocateResult }> {
  return unwrap(cachedLocate(lat.toFixed(2), lng.toFixed(2)));
}

export function getStats(): Promise<{ data: CommunityStats }> {
  return unwrap(cachedStats());
}

export function getAnnouncements(): Promise<{ data: Announcement[] }> {
  return unwrap(cachedAnnouncements());
}

/** Contact details, social links and footer text managed in Admin › Settings (public, shared cache). */
export function getSiteInfo(): Promise<{ data: SiteInfo }> {
  return unwrap(cachedSiteInfo());
}

/** Recent community reviews for the homepage (public, shared cache). */
export function getReviews(): Promise<{ data: Review[] }> {
  return unwrap(cachedReviews());
}

export type ViewerResponse = {
  data: Account;
  meta: { unread_notifications: number; unread_conversations: number };
};

/** The signed-in member, or null for visitors. */
export function getViewer(): Promise<ViewerResponse | null> {
  return serverGet<ViewerResponse>("auth/me").catch((error: unknown) => {
    if (error instanceof ServerApiError && error.status === 401) {
      return null;
    }
    throw error;
  });
}
