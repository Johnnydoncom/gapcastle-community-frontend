import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Crawl rules.
 *
 * Besides private areas, crawlers are kept off filter / sort / search combinations
 * (e.g. /explore?condition=good&sort=nearest). Those pages canonicalise to their
 * unfiltered URL, so indexing is unaffected, but every combination is a separate
 * server render: letting bots walk them all is the fastest way to burn the hosting
 * plan's CPU and function quota. Plain pagination (?page=N) stays crawlable, and
 * every listing is also in the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/admin",
          "/api",
          "/reset-password",
          "/verified",
          "/verify-email",
          "/offline",
          // Request checkout: members only, per-viewer, never worth indexing.
          "/items/*/request",
          // Faceted / search URLs (see above).
          "/*?*q=",
          "/*?*sort=",
          "/*?*condition=",
          "/*?*fulfillment=",
          "/*?*location=",
          "/*?*category=",
          "/*?*within=",
          "/*?*source=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
