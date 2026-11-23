import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { faqItemsFromHtml, mergeJsonLd, toNodes } from "@/lib/json-ld";
import { faqJsonLd } from "@/lib/seo";
import { getSeoPageData } from "@/lib/server/seo-api";

type Props = {
  /** The page's key in Admin › Pages & SEO, e.g. "about". */
  pageKey: string;
  /** Built-in structured data that is always true for the page (breadcrumbs, page type…). */
  data?: unknown;
  /**
   * Built-in structured data that describes the page's built-in wording (FAQ answers,
   * HowTo steps). It is left out once an admin replaces the page content, because
   * structured data must match what visitors can see.
   */
  contentData?: unknown;
  /** Rebuild FAQPage from the admin's own content (headings = questions). */
  faqFromCustomContent?: boolean;
};

/**
 * One JSON-LD graph per page: the built-in schema merged with any custom structured
 * data saved for this page in Admin › Pages & SEO (same @id or @type replaces, the
 * rest is added). Streams in the server HTML, so crawlers always see it.
 */
export function PageJsonLd(props: Props) {
  return (
    <Suspense fallback={null}>
      <PageJsonLdContent {...props} />
    </Suspense>
  );
}

async function PageJsonLdContent({ pageKey, data, contentData, faqFromCustomContent = false }: Props) {
  const seo = await getSeoPageData(pageKey);
  const builtIn = toNodes(data);

  if (seo?.content_body) {
    const faq = faqFromCustomContent ? faqItemsFromHtml(seo.content_body) : [];
    if (faq.length) builtIn.push(...toNodes(faqJsonLd(faq)));
  } else {
    builtIn.push(...toNodes(contentData));
  }

  const { nodes } = mergeJsonLd(builtIn, toNodes(seo?.structured_data));
  return nodes.length ? <JsonLd data={nodes} /> : null;
}
