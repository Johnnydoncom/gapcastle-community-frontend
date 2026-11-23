import "server-only";

import { cache } from "react";
import { backendUrl } from "./backend";
import type { SeoPageData } from "@/lib/seo-types";

/**
 * Fetch SEO page overrides from the backend.
 *
 * Returns `null` when the endpoint doesn't exist yet, the page key has no
 * overrides, or the backend is unreachable. The frontend's hardcoded defaults
 * are always used as fallback, so a null here is completely safe.
 *
 * Results are deduped per request via React `cache()` and revalidated every
 * 60 seconds so dashboard changes propagate quickly without hammering the API.
 */
export const getSeoPageData = cache(async (pageKey: string): Promise<SeoPageData | null> => {
  try {
    const response = await fetch(backendUrl(`seo-pages/${encodeURIComponent(pageKey)}`), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as { data: SeoPageData };
    return payload.data ?? null;
  } catch {
    return null;
  }
});
