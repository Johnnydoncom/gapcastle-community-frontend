import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { BACKEND_TIMEOUT_MS, backendUrl } from "./backend";
import type { SeoPageData } from "@/lib/seo-types";

/**
 * Fetch SEO page overrides from the backend.
 *
 * Returns `null` when the endpoint doesn't exist yet, the page key has no
 * overrides, or the backend is unreachable. The frontend's hardcoded defaults
 * are always used as fallback, so a null here is completely safe.
 *
 * Kept in a shared `use cache` entry for an hour (tagged "seo-pages"). Saving a page in
 * Admin › Pages & SEO purges the tag through /api/revalidate, so edits still appear at once.
 * A failed lookup is cached for 30 seconds only.
 */
export async function getSeoPageData(pageKey: string): Promise<SeoPageData | null> {
  "use cache";
  cacheTag("seo-pages");

  try {
    const response = await fetch(backendUrl(`seo-pages/${encodeURIComponent(pageKey)}`), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });

    // 404 = no overrides for this page: a real answer, cache it normally.
    if (!response.ok) {
      if (response.status === 404) cacheLife("hours");
      else cacheLife({ stale: 30, revalidate: 30, expire: 300 });
      return null;
    }

    cacheLife("hours");
    const payload = (await response.json()) as { data: SeoPageData };
    return payload.data ?? null;
  } catch {
    cacheLife({ stale: 30, revalidate: 30, expire: 300 });
    return null;
  }
}
