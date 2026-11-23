"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  Globe,
  Save,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, errorMessage } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { cn } from "@/lib/utils";
import type { SeoPageData, SeoPagePayload } from "@/lib/seo-types";

/* -------------------------------------------------------------------------- */
/*  Known page keys — the well-known pages whose SEO can be managed            */
/* -------------------------------------------------------------------------- */

const KNOWN_PAGES: Array<{ key: string; label: string; path: string }> = [
  { key: "home", label: "Home", path: "/" },
  { key: "explore", label: "Explore", path: "/explore" },
  { key: "categories", label: "Categories", path: "/categories" },
  { key: "give", label: "Give an item", path: "/give" },
  { key: "pickup-hubs", label: "Pickup hubs", path: "/pickup-hubs" },
  { key: "how-it-works", label: "How it works", path: "/how-it-works" },
  { key: "community", label: "Community", path: "/community" },
  { key: "about", label: "About", path: "/about" },
  { key: "faq", label: "FAQs", path: "/faq" },
  { key: "contact", label: "Contact", path: "/contact" },
  { key: "safety", label: "Safety", path: "/safety" },
  { key: "community-guidelines", label: "Community guidelines", path: "/community-guidelines" },
  { key: "privacy", label: "Privacy policy", path: "/privacy" },
  { key: "terms", label: "Terms of service", path: "/terms" },
];

type SeoEntry = SeoPageData & { _isNew?: boolean };

const EMPTY_ENTRY: SeoPagePayload = {
  page_key: "",
  meta_title: null,
  meta_description: null,
  og_title: null,
  og_description: null,
  og_image: null,
  canonical_url: null,
  robots: null,
  structured_data: null,
  keywords: null,
};

/* ========================================================================== */
/*  Main component                                                             */
/* ========================================================================== */

export function AdminSeoPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<SeoEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-pages"],
    queryFn: () => api.get<{ data: SeoPageData[] }>("admin/seo-pages").then((r) => r.data),
  });

  const entries = data ?? [];
  const entryMap = new Map(entries.map((e) => [e.page_key, e]));

  // Merge known pages with existing entries — show all, configured or not
  const rows = KNOWN_PAGES.map((page) => ({
    ...page,
    entry: entryMap.get(page.key) ?? null,
  }));

  // Also show any custom entries not in KNOWN_PAGES
  const customEntries = entries.filter((e) => !KNOWN_PAGES.some((p) => p.key === e.page_key));

  const filteredRows = search
    ? rows.filter((r) => r.label.toLowerCase().includes(search.toLowerCase()) || r.key.includes(search.toLowerCase()))
    : rows;

  function openEditor(pageKey: string, existing: SeoPageData | null) {
    if (existing) {
      setEditing(existing);
    } else {
      setEditing({ ...EMPTY_ENTRY, page_key: pageKey, _isNew: true, updated_at: "" } as SeoEntry);
    }
  }

  async function handleSave(form: SeoPagePayload) {
    setSaving(true);
    try {
      const isNew = editing?._isNew;
      const method = isNew ? api.post : api.put;
      const path = isNew ? "admin/seo-pages" : `admin/seo-pages/${form.page_key}`;
      const res = await method<{ data: SeoPageData; message: string }>(path, form);
      queryClient.invalidateQueries({ queryKey: ["admin-seo-pages"] });
      toast.success(res.message || "SEO settings saved.");
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save SEO settings."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="SEO settings"
        description="Manage meta titles, descriptions, Open Graph tags and structured data for every page. Changes update within 60 seconds."
      />

      {editing ? (
        <SeoEditor
          entry={editing}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <>
          {/* Search & add */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search pages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <Panel title="Site pages" description="Click a page to configure its SEO meta tags.">
            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border">
                {filteredRows.map((row) => {
                  const configured = !!row.entry;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      onClick={() => openEditor(row.key, row.entry)}
                      disabled={!isAdmin}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        configured ? "bg-primary-50 text-primary" : "bg-muted text-muted-foreground",
                      )}>
                        {configured ? <Globe className="size-4" /> : <FileText className="size-4" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold">{row.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {row.path}
                          {row.entry?.meta_title && ` · ${row.entry.meta_title}`}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        {configured && (
                          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
                            Configured
                          </span>
                        )}
                        {configured && row.entry?.updated_at && (
                          <span className="hidden text-xs text-muted-foreground sm:block">
                            {timeAgo(row.entry.updated_at)}
                          </span>
                        )}
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {customEntries.length > 0 && (
            <Panel title="Custom page entries" description="SEO entries for dynamic or custom pages." className="mt-6">
              <div className="divide-y divide-border rounded-xl border border-border">
                {customEntries.map((entry) => (
                  <button
                    key={entry.page_key}
                    type="button"
                    onClick={() => openEditor(entry.page_key, entry)}
                    disabled={!isAdmin}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                      <Settings2 className="size-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold">{entry.page_key}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.meta_title ?? "No title set"}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </Panel>
          )}

          <SeoPreview />
        </>
      )}

      {!isAdmin && (
        <p className="mt-6 text-sm text-muted-foreground">Only administrators can change SEO settings.</p>
      )}
    </div>
  );
}

/* ========================================================================== */
/*  Editor form                                                                */
/* ========================================================================== */

function SeoEditor({
  entry,
  saving,
  onSave,
  onCancel,
}: {
  entry: SeoEntry;
  saving: boolean;
  onSave: (form: SeoPagePayload) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<SeoPagePayload>({
    page_key: entry.page_key,
    meta_title: entry.meta_title ?? "",
    meta_description: entry.meta_description ?? "",
    og_title: entry.og_title ?? "",
    og_description: entry.og_description ?? "",
    og_image: entry.og_image ?? "",
    canonical_url: entry.canonical_url ?? "",
    robots: entry.robots ?? "index,follow",
    structured_data: entry.structured_data ?? null,
    keywords: entry.keywords ?? "",
  });

  const [structuredDataText, setStructuredDataText] = useState(
    entry.structured_data ? JSON.stringify(entry.structured_data, null, 2) : "",
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const knownPage = KNOWN_PAGES.find((p) => p.key === entry.page_key);
  const pageLabel = knownPage?.label ?? entry.page_key;
  const titleCharCount = (form.meta_title ?? "").length;
  const descCharCount = (form.meta_description ?? "").length;

  function update(field: keyof SeoPagePayload, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Parse structured data JSON
    let parsedJson: Record<string, unknown> | null = null;
    if (structuredDataText.trim()) {
      try {
        parsedJson = JSON.parse(structuredDataText);
        setJsonError(null);
      } catch {
        setJsonError("Invalid JSON — please fix the syntax.");
        return;
      }
    }

    onSave({
      ...form,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      og_title: form.og_title || null,
      og_description: form.og_description || null,
      og_image: form.og_image || null,
      canonical_url: form.canonical_url || null,
      robots: form.robots || null,
      keywords: form.keywords || null,
      structured_data: parsedJson,
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel
        title={`SEO — ${pageLabel}`}
        description={knownPage ? `Path: ${knownPage.path}` : `Key: ${entry.page_key}`}
        actions={
          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        }
      >
        <div className="space-y-5">
          {/* Meta title */}
          <Field label="Meta title" hint={`${titleCharCount}/60 characters recommended`} warning={titleCharCount > 60}>
            <input
              type="text"
              value={form.meta_title ?? ""}
              onChange={(e) => update("meta_title", e.target.value)}
              placeholder="Page title for search engines"
              maxLength={120}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </Field>

          {/* Meta description */}
          <Field label="Meta description" hint={`${descCharCount}/160 characters recommended`} warning={descCharCount > 160}>
            <textarea
              value={form.meta_description ?? ""}
              onChange={(e) => update("meta_description", e.target.value)}
              placeholder="Compelling description for search result snippets"
              maxLength={320}
              rows={3}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary resize-none"
            />
          </Field>

          {/* Keywords */}
          <Field label="Keywords" hint="Comma-separated. Focus on Nigerian search terms.">
            <input
              type="text"
              value={form.keywords ?? ""}
              onChange={(e) => update("keywords", e.target.value)}
              placeholder="free items Nigeria, free furniture Lagos, …"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </Field>

          <hr className="border-border" />

          {/* OG Title */}
          <Field label="Open Graph title" hint="Shared on WhatsApp, Facebook, Twitter, etc.">
            <input
              type="text"
              value={form.og_title ?? ""}
              onChange={(e) => update("og_title", e.target.value)}
              placeholder="Defaults to meta title if empty"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </Field>

          {/* OG Description */}
          <Field label="Open Graph description">
            <textarea
              value={form.og_description ?? ""}
              onChange={(e) => update("og_description", e.target.value)}
              placeholder="Defaults to meta description if empty"
              rows={2}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary resize-none"
            />
          </Field>

          {/* OG Image */}
          <Field label="Open Graph image URL" hint="1200×630 recommended for best display.">
            <input
              type="url"
              value={form.og_image ?? ""}
              onChange={(e) => update("og_image", e.target.value)}
              placeholder="https://…"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </Field>

          <hr className="border-border" />

          {/* Canonical URL */}
          <Field label="Canonical URL" hint="Override the default canonical path.">
            <input
              type="text"
              value={form.canonical_url ?? ""}
              onChange={(e) => update("canonical_url", e.target.value)}
              placeholder="/explore (leave empty for default)"
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </Field>

          {/* Robots */}
          <Field label="Robots directive">
            <select
              value={form.robots ?? "index,follow"}
              onChange={(e) => update("robots", e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-primary"
            >
              <option value="index,follow">index, follow (default)</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </Field>

          <hr className="border-border" />

          {/* Structured data */}
          <Field label="Custom structured data (JSON-LD)" hint="Injected alongside auto-generated schema. Must be valid JSON.">
            <textarea
              value={structuredDataText}
              onChange={(e) => {
                setStructuredDataText(e.target.value);
                setJsonError(null);
              }}
              placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  …\n}'}
              rows={6}
              className={cn("w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary resize-y font-mono text-xs", jsonError && "border-destructive")}
            />
            {jsonError && <p className="mt-1 text-xs text-destructive">{jsonError}</p>}
          </Field>

          {/* Google SERP preview */}
          <SerpPreview
            title={form.meta_title || pageLabel}
            description={form.meta_description || ""}
            path={knownPage?.path ?? `/${entry.page_key}`}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Changes apply to the next page render (cached up to 60 seconds).
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving…" : "Save SEO settings"}
            </Button>
          </div>
        </div>
      </Panel>
    </form>
  );
}

/* ========================================================================== */
/*  SERP preview                                                               */
/* ========================================================================== */

function SerpPreview({ title, description, path }: { title: string; description: string; path: string }) {
  const displayTitle = title ? `${title} — Gratis Castle` : "Gratis Castle";
  const displayUrl = `gapcastle.com${path}`;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Google preview</p>
      <div className="max-w-xl">
        <p className="text-xs text-[#202124]">{displayUrl}</p>
        <p className="mt-0.5 text-lg leading-snug text-[#1a0dab] hover:underline" style={{ fontFamily: "Arial, sans-serif" }}>
          {displayTitle.length > 60 ? `${displayTitle.slice(0, 57)}…` : displayTitle}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-[#4d5156]" style={{ fontFamily: "Arial, sans-serif" }}>
          {description
            ? description.length > 160 ? `${description.slice(0, 157)}…` : description
            : "No description set — Google will auto-generate one from the page content."}
        </p>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  SEO health overview                                                        */
/* ========================================================================== */

function SeoPreview() {
  return (
    <Panel title="SEO checklist" description="Quick overview of your site's SEO setup." className="mt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckItem label="Organization schema" done description="Site-wide JSON-LD in root layout" />
        <CheckItem label="WebSite + SearchAction" done description="Sitelinks search box enabled" />
        <CheckItem label="LocalBusiness schema" done description="Nigeria geo-targeting active" />
        <CheckItem label="Product schema" done description="All item pages have Product JSON-LD" />
        <CheckItem label="BreadcrumbList" done description="All pages have breadcrumb navigation" />
        <CheckItem label="FAQPage schema" done description="FAQ page has structured questions" />
        <CheckItem label="Sitemap.xml" done description="Dynamic sitemap with all pages" />
        <CheckItem label="Robots.txt" done description="Private pages disallowed" />
        <CheckItem label="Canonical URLs" done description="All pages have canonical alternates" />
        <CheckItem label="Open Graph tags" done description="WhatsApp/social preview optimised" />
        <CheckItem label="Meta descriptions" done description="Nigeria-focused descriptions" />
        <CheckItem label="Server-side rendering" done description="All pages SSR by default" />
      </div>
    </Panel>
  );
}

function CheckItem({ label, done, description }: { label: string; done: boolean; description: string }) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border p-3 text-sm", done ? "border-success/30 bg-success-soft/30" : "border-border")}>
      <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", done ? "bg-success text-white" : "bg-muted text-muted-foreground")}>
        ✓
      </span>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </div>
  );
}

/* ========================================================================== */
/*  Form field wrapper                                                         */
/* ========================================================================== */

function Field({ label, hint, warning, children }: { label: string; hint?: string; warning?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-semibold">
        {label}
        {hint && <span className={cn("text-xs font-normal", warning ? "text-destructive" : "text-muted-foreground")}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}
