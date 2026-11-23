import "server-only";

import type { Metadata } from "next";
import { getSeoPageData } from "./seo-api";

function robotsFrom(value: string): Metadata["robots"] {
  const parts = value.toLowerCase().split(",").map((part) => part.trim());
  return { index: !parts.includes("noindex"), follow: !parts.includes("nofollow") };
}

/**
 * Merge the SEO overrides saved in Admin › Pages & SEO on top of a page's built-in
 * metadata. Any field left empty in the dashboard keeps the page's default, and if
 * the API is unreachable the defaults are used unchanged.
 */
export async function withSeoOverrides(pageKey: string, base: Metadata): Promise<Metadata> {
  const seo = await getSeoPageData(pageKey);
  if (!seo) return base;

  const title = seo.meta_title ? { absolute: seo.meta_title } : base.title;
  const description = seo.meta_description ?? base.description;
  const ogTitle = seo.og_title ?? seo.meta_title ?? undefined;
  const ogDescription = seo.og_description ?? seo.meta_description ?? undefined;
  const images = seo.og_image ? [{ url: seo.og_image }] : undefined;

  return {
    ...base,
    title,
    description,
    ...(seo.keywords ? { keywords: seo.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean) } : {}),
    ...(seo.canonical_url ? { alternates: { ...base.alternates, canonical: seo.canonical_url } } : {}),
    ...(seo.robots ? { robots: robotsFrom(seo.robots) } : {}),
    openGraph: {
      ...base.openGraph,
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(ogDescription ? { description: ogDescription } : {}),
      ...(images ? { images } : {}),
    },
    twitter: {
      ...base.twitter,
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(ogDescription ? { description: ogDescription } : {}),
      ...(images ? { images: images.map((image) => image.url) } : {}),
    },
  };
}
