import { serializeJsonLd } from "@/lib/json-ld";

/**
 * Reusable Server Component that injects JSON-LD structured data into the page.
 * Output is escaped so user-supplied text can never close the <script> tag.
 *
 * Usage:
 *   <JsonLd data={faqJsonLd(items)} />
 *   <JsonLd data={[breadcrumbJsonLd(crumbs), collectionPageJsonLd(opts)]} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const payload = Array.isArray(data) ? { "@context": "https://schema.org", "@graph": data } : data;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }} />;
}
