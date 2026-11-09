import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE, backendUrl } from "./backend";
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
  /** Seconds to cache the response. Omit for fresh, request-time data. */
  revalidate?: number;
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

const cachedGet = cache(async (path: string, search: string, authenticated: boolean, revalidate?: number): Promise<unknown> => {
  const headers = new Headers({ Accept: "application/json" });

  if (authenticated) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${backendUrl(path)}${search}`, {
    headers,
    ...(revalidate === undefined
      ? { cache: "no-store" as const }
      : { next: { revalidate } }),
  });

  if (!response.ok) {
    throw new ServerApiError(response.status, response.status === 404 ? "Not found" : "The community service is unavailable.");
  }

  return response.json();
});

async function serverGet<T>(path: string, query?: ServerQuery, options: RequestOptions = {}): Promise<T> {
  return (await cachedGet(path, queryString(query), options.authenticated ?? true, options.revalidate)) as T;
}

export type ListingQuery = {
  q?: string;
  category?: string;
  location?: string;
  condition?: string;
  fulfillment?: string;
  sort?: string;
  near?: string;
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
  return serverGet<{ data: Category[] }>("categories", undefined, { authenticated: false, revalidate: 60 });
}

export function getCategory(slug: string): Promise<{ data: Category }> {
  return serverGet<{ data: Category }>(`categories/${encodeURIComponent(slug)}`, undefined, { revalidate: 60 });
}

export function getProfile(slug: string): Promise<{
  data: PublicProfile;
  listings: Listing[];
  meta: { is_blocked: boolean; is_self: boolean };
}> {
  return serverGet(`users/${encodeURIComponent(slug)}`);
}

export function getLocations(): Promise<{ data: LocationOption[] }> {
  return serverGet<{ data: LocationOption[] }>("listings/locations", undefined, { revalidate: 60 });
}

/** Nigerian states with their active pickup hubs (public, cached briefly). */
export function getStates(): Promise<{ data: NgState[] }> {
  return serverGet<{ data: NgState[] }>("states", undefined, { authenticated: false, revalidate: 60 });
}

export function getStats(): Promise<{ data: CommunityStats }> {
  return serverGet<{ data: CommunityStats }>("stats", undefined, { revalidate: 60 });
}

export function getAnnouncements(): Promise<{ data: Announcement[] }> {
  return serverGet<{ data: Announcement[] }>("announcements", undefined, { revalidate: 60 });
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
