/**
 * Types for dashboard-managed SEO data.
 *
 * Admins can override meta titles, descriptions, OG tags and structured data
 * for any page from the admin dashboard. The frontend reads these at render
 * time and merges them with the hardcoded defaults.
 */

/** SEO data for a specific page, managed from the admin dashboard. */
export type SeoPageData = {
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  canonical_url: string | null;
  /** e.g. "index,follow" or "noindex,nofollow" */
  robots: string | null;
  /** Custom JSON-LD overrides injected alongside auto-generated structured data. */
  structured_data: Record<string, unknown> | null;
  keywords: string | null;
  updated_at: string;
};

/** Summary row returned when listing all SEO page entries. */
export type SeoPageSummary = {
  page_key: string;
  meta_title: string | null;
  meta_description: string | null;
  robots: string | null;
  updated_at: string;
};

/** Payload sent when creating or updating an SEO page entry. */
export type SeoPagePayload = Omit<SeoPageData, "updated_at">;
