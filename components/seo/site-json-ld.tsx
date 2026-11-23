import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { mergeJsonLd, toNodes } from "@/lib/json-ld";
import { siteJsonLd } from "@/lib/seo";
import { getSiteInfo } from "@/lib/server/api";
import { getSeoPageData } from "@/lib/server/seo-api";

/** Page key for structured data that applies to every page (Admin › Pages & SEO › Site-wide). */
export const SITE_WIDE_SEO_KEY = "site";

/**
 * Organization, WebSite and LocalBusiness for every page, using the contact details and
 * social profiles from Admin › Settings, merged with any site-wide custom structured data.
 */
export function SiteJsonLd() {
  return (
    <Suspense fallback={null}>
      <SiteJsonLdContent />
    </Suspense>
  );
}

async function SiteJsonLdContent() {
  const [site, seo] = await Promise.all([
    getSiteInfo().then((response) => response.data).catch(() => null),
    getSeoPageData(SITE_WIDE_SEO_KEY),
  ]);
  const { nodes } = mergeJsonLd(toNodes(siteJsonLd(site)), toNodes(seo?.structured_data));
  return <JsonLd data={nodes} />;
}
