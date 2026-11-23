"use client";

import { AlertTriangle, CheckCircle2, ExternalLink, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { mergeJsonLd, toNodes, validateCustomJsonLd, type JsonLdNode } from "@/lib/json-ld";
import { SITE_URL, absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type BuiltIn = { type: string; id?: string; note?: string; fixed?: boolean };

const BREADCRUMB: BuiltIn = { type: "BreadcrumbList", note: "Home › this page" };
const NONE: BuiltIn[] = [];

/** What each page already outputs (see components/seo/page-json-ld.tsx and site-json-ld.tsx). */
export const BUILT_IN_SCHEMA: Record<string, BuiltIn[]> = {
  site: [
    { type: "Organization", id: `${SITE_URL}/#organization`, note: "Contact details and social links from Site settings" },
    { type: "WebSite", id: `${SITE_URL}/#website`, note: "Sitelinks search box" },
    { type: "LocalBusiness", id: `${SITE_URL}/#localbusiness`, note: "Nigeria / Lagos" },
  ],
  home: [{ type: "HowTo", note: "How Gratis Castle works" }, BREADCRUMB],
  explore: [{ type: "CollectionPage" }, BREADCRUMB, { type: "ItemList", note: "The items shown — generated from live results", fixed: true }],
  categories: [{ type: "CollectionPage" }, BREADCRUMB, { type: "ItemList", note: "Every category — generated live", fixed: true }],
  give: [BREADCRUMB],
  "pickup-hubs": [BREADCRUMB],
  "how-it-works": [{ type: "HowTo", note: "From the built-in steps — left out if you replace the page content" }, BREADCRUMB],
  community: [BREADCRUMB],
  about: [{ type: "AboutPage" }, BREADCRUMB],
  faq: [{ type: "FAQPage", note: "Built from the page's questions — including your own content (each heading becomes a question)" }, BREADCRUMB],
  contact: [{ type: "ContactPage" }, BREADCRUMB],
  safety: [BREADCRUMB],
  "community-guidelines": [BREADCRUMB],
  privacy: [BREADCRUMB],
  terms: [BREADCRUMB],
};

const TEMPLATES: Array<{ key: string; label: string; site?: boolean; build: () => JsonLdNode }> = [
  {
    key: "faq",
    label: "FAQ (questions & answers)",
    build: () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Is everything on Gratis Castle free?", acceptedAnswer: { "@type": "Answer", text: "Yes. Items and delivery are free — never pay anyone for an item." } },
      ],
    }),
  },
  {
    key: "event",
    label: "Event (e.g. a community swap day)",
    build: () => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Gratis Castle community giveaway day",
      description: "Bring items you no longer need and pick up something useful — everything is free.",
      startDate: "2026-12-12T10:00:00+01:00",
      endDate: "2026-12-12T16:00:00+01:00",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      isAccessibleForFree: true,
      location: { "@type": "Place", name: "Gratis Castle Ikeja hub", address: { "@type": "PostalAddress", streetAddress: "Street address", addressLocality: "Ikeja", addressRegion: "Lagos", addressCountry: "NG" } },
      organizer: { "@id": `${SITE_URL}/#organization` },
      offers: { "@type": "Offer", price: 0, priceCurrency: "NGN", availability: "https://schema.org/InStock", url: SITE_URL },
    }),
  },
  {
    key: "article",
    label: "Article / news post",
    build: () => ({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Headline shown on this page",
      datePublished: new Date().toISOString().slice(0, 10),
      author: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    }),
  },
  {
    key: "webpage",
    label: "WebPage details",
    build: () => ({ "@context": "https://schema.org", "@type": "WebPage", name: "Page name", description: "What this page is about.", inLanguage: "en-NG" }),
  },
  {
    key: "organization",
    label: "Organization details (updates the built-in one)",
    site: true,
    build: () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      legalName: "Registered company name",
      foundingDate: "2026",
      slogan: "Give freely. Receive gratefully.",
    }),
  },
];

export type StructuredDataState = { text: string; error: string | null };

/** Parse the editor text. Empty text means "no custom structured data". */
export function parseStructuredData(text: string): { value: unknown; error: string | null } {
  if (!text.trim()) return { value: null, error: null };
  try {
    const value: unknown = JSON.parse(text);
    return { value, error: validateCustomJsonLd(value) };
  } catch (err) {
    return { value: null, error: `Invalid JSON — ${err instanceof Error ? err.message : "please fix the syntax"}.` };
  }
}

/**
 * Custom JSON-LD for one page (or site-wide): built-in schema overview, templates,
 * live validation, a merge preview and links to Google's and Schema.org's validators.
 */
export function StructuredDataPanel({ pageKey, path, text, onChange, actions, serverError }: {
  pageKey: string;
  path: string;
  text: string;
  onChange: (text: string) => void;
  actions?: React.ReactNode;
  serverError?: string | null;
}) {
  const builtIn = BUILT_IN_SCHEMA[pageKey] ?? NONE;
  const parsed = useMemo(() => parseStructuredData(text), [text]);
  const merge = useMemo(() => {
    if (parsed.error || !parsed.value) return null;
    const stubs = builtIn.filter((item) => !item.fixed).map((item) => ({ "@type": item.type, ...(item.id ? { "@id": item.id } : {}) }));
    return mergeJsonLd(stubs, toNodes(parsed.value));
  }, [parsed, builtIn]);
  const pageUrl = absoluteUrl(path);
  const templates = TEMPLATES.filter((template) => (pageKey === "site" ? template.site || template.key === "webpage" : !template.site));

  function insert(key: string) {
    const template = TEMPLATES.find((item) => item.key === key);
    if (!template) return;
    const node = template.build();
    const existing = parsed.error ? [] : toNodes(parsed.value);
    const next = existing.length ? { "@context": "https://schema.org", "@graph": [...existing, node] } : node;
    onChange(JSON.stringify(next, null, 2));
  }

  function format() {
    if (!parsed.value) return;
    onChange(JSON.stringify(parsed.value, null, 2));
  }

  const error = parsed.error ?? serverError ?? null;

  return (
    <Panel
      title={pageKey === "site" ? "Site-wide structured data" : "Structured data (JSON-LD)"}
      description={pageKey === "site" ? "Added to every page of the website." : "Helps Google show rich results for this page. It must describe what visitors can actually see on the page."}
      actions={actions}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold">Already on this page</p>
          {builtIn.length ? (
            <ul className="flex flex-wrap gap-2">
              {builtIn.map((item) => (
                <li key={item.type} className="rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs" title={item.note}>
                  <span className="font-mono font-semibold">{item.type}</span>
                  {item.note && <span className="ml-1.5 text-muted-foreground">{item.note}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing built in for this page.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            A custom item with the same <code className="font-mono">@id</code> or <code className="font-mono">@type</code> as a built-in one updates it — your properties win, the rest is kept, and a property set to <code className="font-mono">null</code> is removed. Anything else is added.
            {pageKey !== "site" && " Organization, WebSite and LocalBusiness are site-wide — edit them under “Site-wide (every page)”."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Insert a template"
            value=""
            onChange={(event) => insert(event.target.value)}
            className="select-caret h-9 rounded-lg border border-input bg-card pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          >
            <option value="" disabled>Insert a template…</option>
            {templates.map((template) => <option key={template.key} value={template.key}>{template.label}</option>)}
          </select>
          <Button type="button" size="sm" variant="outline" onClick={format} disabled={!parsed.value}><Wand2 className="size-4" /> Format</Button>
          {text.trim() && <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>Clear</Button>}
        </div>

        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          rows={Math.min(24, Math.max(8, text.split("\n").length + 1))}
          aria-label="Custom structured data JSON"
          aria-invalid={!!error}
          placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  …\n}'}
          className={cn("w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs leading-relaxed outline-none transition-colors focus:border-primary", error && "border-destructive")}
        />

        {error ? (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"><AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {error}</p>
        ) : merge && (merge.updated.length || merge.added.length) ? (
          <div className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">
            <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-3.5" /> Valid schema.org JSON-LD</p>
            {merge.updated.length > 0 && <p className="mt-1">Updates built-in: <span className="font-mono">{merge.updated.join(", ")}</span></p>}
            {merge.added.length > 0 && <p className="mt-0.5">Adds: <span className="font-mono">{merge.added.join(", ")}</span></p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No custom structured data — only the built-in schema is used.</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <ExternalLink className="size-3.5" /> Google Rich Results Test
          </a>
          <a href={`https://validator.schema.org/#url=${encodeURIComponent(pageUrl)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
            <ExternalLink className="size-3.5" /> Schema.org validator
          </a>
          <span className="text-muted-foreground">Run these after saving — the live page updates within about a minute.</span>
        </div>
      </div>
    </Panel>
  );
}
