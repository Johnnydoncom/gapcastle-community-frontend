/** Canonical public site details used by metadata, JSON-LD and the sitemap. */

export const SITE_NAME = "Gap Castle Community";
export const SITE_TAGLINE = "Give freely. Receive gratefully. Build community.";
export const SITE_DESCRIPTION =
  "Discover useful things shared freely by people in your community. Give your unused items a new home or find something you need, completely free.";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function listingPath(slug?: string | number | null): string {
  if (!slug || slug === "null") return "/explore";
  return `/items/${slug}`;
}

export function profilePath(slug?: string | number | null): string {
  if (!slug || slug === "null") return "/explore";
  return `/users/${slug}`;
}

export function categoryPath(slug?: string | null): string {
  if (!slug || slug === "null") return "/categories";
  return `/categories/${slug}`;
}
