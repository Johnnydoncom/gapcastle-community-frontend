/**
 * Central SEO configuration, metadata builder and JSON-LD generators.
 *
 * Every public page imports from here to build consistent, rich metadata
 * and structured data. All functions are pure — no side effects, no "use client".
 */

import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, absoluteUrl } from "@/lib/site";
import type { SeoPageData } from "@/lib/seo-types";
import type { Category, CommunityStats, Listing, PublicProfile } from "@/lib/types";
import type { ContentPageData } from "@/lib/content";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

export const DEFAULT_OG_IMAGE = "/brand/logo-lockup-768x553.png";
export const DEFAULT_OG_IMAGE_WIDTH = 768;
export const DEFAULT_OG_IMAGE_HEIGHT = 553;
export const GEO_REGION = "NG";
export const GEO_PLACENAME = "Nigeria";
export const LOCALE = "en_NG";

/* -------------------------------------------------------------------------- */
/*  Metadata builder                                                           */
/* -------------------------------------------------------------------------- */

type MetadataOptions = {
  title: string | { absolute: string };
  description: string;
  canonical: string;
  ogType?: "website" | "article" | "profile";
  ogImages?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
  twitterCard?: "summary" | "summary_large_image";
  robots?: Metadata["robots"];
  keywords?: string[];
  /** Dashboard SEO overrides — merged on top of the hardcoded values. */
  seoOverrides?: SeoPageData | null;
};

/**
 * Build a complete Next.js `Metadata` object with sensible defaults.
 * When `seoOverrides` is provided (from the admin dashboard), its non-null
 * fields take precedence over the hardcoded values.
 */
export function buildMetadata(options: MetadataOptions): Metadata {
  const seo = options.seoOverrides;

  const title = seo?.meta_title
    ? (typeof options.title === "string" ? seo.meta_title : { absolute: seo.meta_title })
    : options.title;

  const description = seo?.meta_description ?? options.description;
  const canonical = seo?.canonical_url ?? options.canonical;
  const ogTitle = seo?.og_title ?? (typeof options.title === "string" ? options.title : options.title.absolute);
  const ogDescription = seo?.og_description ?? description;
  const ogImages = seo?.og_image
    ? [{ url: seo.og_image }]
    : options.ogImages ?? [{ url: DEFAULT_OG_IMAGE, width: DEFAULT_OG_IMAGE_WIDTH, height: DEFAULT_OG_IMAGE_HEIGHT, alt: SITE_NAME }];

  const robots: Metadata["robots"] = seo?.robots
    ? parseRobotsString(seo.robots)
    : options.robots;

  const meta: Metadata = {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: options.ogType ?? "website",
      url: canonical,
      title: `${ogTitle} — ${SITE_NAME}`,
      description: ogDescription,
      siteName: SITE_NAME,
      locale: LOCALE,
      images: ogImages,
    },
    twitter: {
      card: options.twitterCard ?? "summary_large_image",
      title: `${ogTitle} — ${SITE_NAME}`,
      description: ogDescription,
      images: ogImages.map((img) => img.url),
    },
    other: {
      "geo.region": GEO_REGION,
      "geo.placename": GEO_PLACENAME,
    },
  };

  if (robots) meta.robots = robots;
  if (options.keywords?.length || seo?.keywords) {
    meta.keywords = seo?.keywords?.split(",").map((k) => k.trim()) ?? options.keywords;
  }

  return meta;
}

function parseRobotsString(robots: string): Metadata["robots"] {
  const parts = robots.toLowerCase().split(",").map((s) => s.trim());
  return {
    index: !parts.includes("noindex"),
    follow: !parts.includes("nofollow"),
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: Organization + WebSite (homepage / root layout)                   */
/* -------------------------------------------------------------------------- */

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(DEFAULT_OG_IMAGE),
      width: DEFAULT_OG_IMAGE_WIDTH,
      height: DEFAULT_OG_IMAGE_HEIGHT,
    },
    description: SITE_TAGLINE,
    sameAs: [],
    areaServed: {
      "@type": "Country",
      name: "Nigeria",
    },
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "NG",
      },
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: "Nigeria's free community marketplace. Give or pick an item for free — free delivery across Nigeria.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-NG",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Combined Organization + WebSite graph for the root layout. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationJsonLd(), websiteJsonLd()],
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: BreadcrumbList                                                    */
/* -------------------------------------------------------------------------- */

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: FAQPage                                                           */
/* -------------------------------------------------------------------------- */

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Build FAQ JSON-LD from the ContentPageData format used by content.ts. */
export function faqJsonLdFromContent(content: ContentPageData) {
  const items = content.sections
    .filter((section) => section.body)
    .map((section) => ({
      question: section.heading,
      answer: section.body!,
    }));
  return faqJsonLd(items);
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: ItemList (categories, listings, search results)                   */
/* -------------------------------------------------------------------------- */

export function itemListJsonLd(name: string, items: Array<{ name: string; url: string; image?: string; position?: number }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: item.position ?? index + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/** Build an ItemList from Category[] for the categories index. */
export function categoryListJsonLd(categories: Category[]) {
  return itemListJsonLd(
    "Free item categories on Gratis Castle",
    categories.map((cat) => ({
      name: cat.name,
      url: `/categories/${cat.slug}`,
      image: cat.image_url ?? undefined,
    })),
  );
}

/** Build an ItemList from Listing[] for category or explore pages. */
export function listingListJsonLd(name: string, listings: Listing[]) {
  return itemListJsonLd(
    name,
    listings.map((listing) => ({
      name: listing.title,
      url: `/items/${listing.slug}`,
      image: listing.images?.[0]?.url,
    })),
  );
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: CollectionPage (category detail, explore)                         */
/* -------------------------------------------------------------------------- */

export function collectionPageJsonLd(options: { name: string; description: string; url: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: options.url.startsWith("http") ? options.url : absoluteUrl(options.url),
    isPartOf: { "@id": `${SITE_URL}/#website` },
    inLanguage: "en-NG",
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: ProfilePage                                                       */
/* -------------------------------------------------------------------------- */

export function profileJsonLd(member: PublicProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: member.name,
      url: absoluteUrl(`/users/${member.slug}`),
      image: member.avatar_url ?? undefined,
      description: member.bio ?? `${member.name} shares free items on Gratis Castle in Nigeria.`,
      address: member.location
        ? {
            "@type": "PostalAddress",
            addressLocality: member.location,
            addressCountry: "NG",
          }
        : undefined,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: AboutPage / Organization                                          */
/* -------------------------------------------------------------------------- */

export function aboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${SITE_NAME}`,
    description: "Gratis Castle is Nigeria's free community marketplace where neighbours pass on useful things they no longer need.",
    url: absoluteUrl("/about"),
    mainEntity: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-NG",
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: ContactPage                                                       */
/* -------------------------------------------------------------------------- */

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${SITE_NAME}`,
    description: "Get in touch with the Gratis Castle team.",
    url: absoluteUrl("/contact"),
    mainEntity: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en-NG",
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: LocalBusiness — Nigeria geo-targeting                             */
/* -------------------------------------------------------------------------- */

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: SITE_NAME,
    description: "Free community marketplace in Nigeria. Give freely, receive gratefully.",
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      addressRegion: "Lagos",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 6.5244,
      longitude: 3.3792,
    },
    areaServed: {
      "@type": "Country",
      name: "Nigeria",
    },
    priceRange: "Free",
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: HowTo (how-it-works page)                                        */
/* -------------------------------------------------------------------------- */

export function howItWorksJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to give and receive free items on Gratis Castle",
    description: "Gratis Castle connects people who have something to give with people who need it. Every item is free.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Share your item",
        text: "List an item you no longer need. Add photos, describe its condition and pick a category.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Discover free items",
        text: "Browse free items by category, condition and location. Save what you like.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Check out and receive",
        text: "Check out for free — no approval needed. Choose our pickup hub or free delivery and Gratis Castle handles the handover.",
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD: CommunityStats aggregate data                                     */
/* -------------------------------------------------------------------------- */

export function communityStatsJsonLd(stats: CommunityStats) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} Community`,
    description: `${stats.items_shared} items shared, ${stats.items_rehomed} rehomed, ${stats.members} members in Nigeria's free community marketplace.`,
    url: absoluteUrl("/community"),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}
