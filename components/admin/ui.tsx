"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ImagePlus, Loader2, MoreHorizontal, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Shared building blocks for every admin screen, so the dashboard feels like one product. */

export type PageMeta = { current_page: number; last_page: number; total: number; per_page?: number; from?: number | null; to?: number | null };
export type Paged<T> = { data: T[]; meta: PageMeta };

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: string; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6">
      {back && <div className="mb-3">{back}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: ReactNode; description?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card shadow-soft", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-bold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** The card every admin table sits in. */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-border bg-card shadow-soft", className)}>{children}</div>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">{children}</div>;
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative flex h-9 min-w-56 flex-1 items-center sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
      <span className="sr-only">{placeholder}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

/** A compact filter dropdown with a visible chevron. An active (non-empty) filter is highlighted. */
export function FilterSelect({ value, onChange, label, children, className }: { value: string; onChange: (value: string) => void; label: string; children: ReactNode; className?: string }) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "select-caret h-9 max-w-56 rounded-lg border border-input bg-card pl-3 text-sm outline-none transition hover:border-foreground/25 focus:border-primary/50 focus:ring-2 focus:ring-ring/30",
        value && "border-primary/40 bg-primary-50/60 font-medium text-primary-700",
        className,
      )}
    >
      {children}
    </select>
  );
}

export function DataTable({ head, children, empty, loading, minWidth = 760, emptyText = "Nothing matches these filters." }: { head: ReactNode; children: ReactNode; empty?: boolean; loading?: boolean; minWidth?: number; emptyText?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground [&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-2.5">
          {head}
        </thead>
        <tbody className="divide-y divide-border [&_td]:px-4 [&_td]:py-3 [&_tr]:transition-colors [&_tr:hover]:bg-muted/30">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}><td colSpan={20}><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
            ))
          ) : children}
        </tbody>
      </table>
      {!loading && empty && <p className="px-4 py-12 text-center text-sm text-muted-foreground">{emptyText}</p>}
    </div>
  );
}

const PAGE_SIZES = [10, 20, 50, 100];

/** Numbered pagination with a page-size picker, shown under every admin table. */
export function Pagination({ meta, onPage, onPerPage, page, lastPage, total }: { meta?: PageMeta; onPage: (page: number) => void; onPerPage?: (perPage: number) => void; page?: number; lastPage?: number; total?: number }) {
  const current = meta?.current_page ?? page ?? 1;
  const last = Math.max(1, meta?.last_page ?? lastPage ?? 1);
  const count = meta?.total ?? total ?? 0;
  const perPage = meta?.per_page;

  const pages: Array<number | "gap"> = [];
  for (let n = 1; n <= last; n++) {
    if (n === 1 || n === last || Math.abs(n - current) <= 1) pages.push(n);
    else if (pages[pages.length - 1] !== "gap") pages.push("gap");
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>
          {meta?.from && meta?.to ? <>Showing <b className="text-foreground">{meta.from.toLocaleString("en-NG")}–{meta.to.toLocaleString("en-NG")}</b> of </> : null}
          <b className="text-foreground">{count.toLocaleString("en-NG")}</b> result{count === 1 ? "" : "s"}
        </span>
        {onPerPage && perPage && (
          <FilterSelect label="Rows per page" value={String(perPage)} onChange={(value) => onPerPage(Number(value))} className="h-8 border-input bg-card font-normal text-foreground">
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / page</option>)}
          </FilterSelect>
        )}
      </div>
      {last > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button size="icon-sm" variant="ghost" disabled={current <= 1} onClick={() => onPage(1)} aria-label="First page"><ChevronsLeft className="size-4" /></Button>
          <Button size="icon-sm" variant="ghost" disabled={current <= 1} onClick={() => onPage(current - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
          {pages.map((item, index) =>
            item === "gap" ? (
              <span key={`gap-${index}`} className="px-1">…</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPage(item)}
                aria-current={item === current ? "page" : undefined}
                className={cn("h-8 min-w-8 rounded-md px-2 text-sm font-semibold transition-colors", item === current ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted")}
              >
                {item}
              </button>
            ),
          )}
          <Button size="icon-sm" variant="ghost" disabled={current >= last} onClick={() => onPage(current + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
          <Button size="icon-sm" variant="ghost" disabled={current >= last} onClick={() => onPage(last)} aria-label="Last page"><ChevronsRight className="size-4" /></Button>
        </nav>
      )}
    </div>
  );
}

/**
 * Table state (page, page size, search and filters) kept in the URL, so filtered
 * views can be bookmarked and the browser back button works.
 */
export function useTableState<F extends Record<string, string>>(filterDefaults: F, perPageDefault = 20) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const read = (key: string, fallback: string) => params.get(key) ?? fallback;
  const filters = Object.fromEntries(Object.entries(filterDefaults).map(([key, fallback]) => [key, read(key, fallback)])) as F;
  const page = Math.max(1, Number(read("page", "1")) || 1);
  const perPage = Number(read("per_page", String(perPageDefault))) || perPageDefault;
  const [q, setQState] = useState(read("q", ""));
  const search = useDeferredValue(q.trim());

  function replace(changes: Record<string, string | number | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      const fallback = key === "page" ? "1" : key === "per_page" ? String(perPageDefault) : (filterDefaults as Record<string, string>)[key] ?? "";
      if (value === null || String(value) === fallback) next.delete(key);
      else next.set(key, String(value));
    }
    const text = next.toString();
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
  }

  return {
    page,
    perPage,
    q,
    search,
    filters,
    setQ: (value: string) => {
      setQState(value);
      replace({ q: value || null, page: null });
    },
    setFilter: (key: keyof F & string, value: string) => replace({ [key]: value, page: null }),
    setPage: (value: number) => replace({ page: value }),
    setPerPage: (value: number) => replace({ per_page: value, page: null }),
    /** Query params for the API call. */
    query: { ...filters, q: search || undefined, page, per_page: perPage } as Record<string, string | number | undefined>,
  };
}

const PILL_TONES = {
  green: "bg-success-soft text-success",
  yellow: "bg-highlight-soft text-highlight-soft-foreground",
  blue: "bg-primary-50 text-primary-700",
  gray: "bg-muted text-muted-foreground",
  red: "bg-destructive/10 text-destructive",
} as const;

export function Pill({ tone = "gray", children }: { tone?: keyof typeof PILL_TONES; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", PILL_TONES[tone])}>{children}</span>;
}

export const STATUS_TONE: Record<string, keyof typeof PILL_TONES> = {
  available: "green", approved: "green", accepted: "blue", completed: "green", open: "red", resolved: "green",
  pending: "yellow", reserved: "blue", reviewed: "yellow", paused: "gray", given_away: "blue",
  removed: "red", rejected: "red", declined: "gray", cancelled: "gray", dismissed: "gray",
  new: "red", in_progress: "yellow", spam: "gray",
};

export function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function RowActions({ items }: { items: Array<{ label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; hidden?: boolean } | "separator"> }) {
  const visible = items.filter((item) => item === "separator" || !item.hidden);
  if (!visible.some((item) => item !== "separator")) return null;
  // Drop leading/trailing/double separators left behind by hidden items.
  const cleaned = visible.filter((item, index) => item !== "separator" || (index > 0 && index < visible.length - 1 && visible[index - 1] !== "separator"));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Actions"><MoreHorizontal className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {cleaned.map((item, index) =>
          item === "separator" ? (
            <DropdownMenuSeparator key={`sep-${index}`} />
          ) : (
            <DropdownMenuItem key={item.label} onSelect={item.onSelect} className={cn("cursor-pointer", item.danger && "text-destructive focus:text-destructive")}>
              {item.icon} {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A confirmation dialog for destructive actions — never the browser's confirm(). */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; description: string; confirmLabel: string; action: () => Promise<void> } | null>(null);
  const [busy, setBusy] = useState(false);

  const element = (
    <Dialog open={!!state} onOpenChange={(open) => !open && !busy && setState(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{state?.title}</DialogTitle>
          <DialogDescription>{state?.description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => setState(null)} disabled={busy}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              if (!state) return;
              setBusy(true);
              try {
                await state.action();
                setState(null);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" />} {state?.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return {
    confirm: (options: { title: string; description: string; confirmLabel?: string; action: () => Promise<void> }) =>
      setState({ confirmLabel: "Delete", ...options }),
    element,
  };
}

export function Field({ label, hint, error, children, className, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Field errors from a failed save, keyed by field name. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {};
  return Object.fromEntries(Object.entries(err.errors).map(([key, messages]) => [key, messages[0] ?? ""]));
}

/**
 * Upload one image through the admin upload endpoint and show a preview.
 * `value` is the stored path (or null); `previewUrl` is what to show for it.
 */
export function ImageUploadField({ folder, value, previewUrl, onChange, disabled, aspect = "aspect-[16/9]" }: {
  folder: "categories" | "pages" | "seo";
  value: string | null;
  previewUrl: string | null;
  onChange: (path: string | null, url: string | null) => void;
  disabled?: boolean;
  aspect?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("folder", folder);
      form.append("image", file);
      const response = await api.post<{ path: string; url: string }>("admin/uploads", form);
      onChange(response.path, response.url);
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload the image"));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => event.target.files?.[0] && void upload(event.target.files[0])} disabled={disabled || busy} />
      {previewUrl ? (
        <div className={cn("group relative overflow-hidden rounded-xl border border-border bg-muted", aspect)}>
          <Image src={previewUrl} alt="" fill sizes="480px" className="object-cover" />
          {busy && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="size-6 animate-spin text-white" /></div>}
          {!disabled && (
            <div className="absolute right-2 top-2 flex gap-1.5">
              <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()} disabled={busy}><ImagePlus className="size-4" /> Replace</Button>
              <Button type="button" size="icon-sm" variant="secondary" onClick={() => onChange(null, null)} aria-label="Remove image" disabled={busy}><Trash2 className="size-4" /></Button>
            </div>
          )}
          {value === null && <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">External image</span>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled || busy}
          className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary-50/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60", aspect)}
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="font-semibold">{busy ? "Uploading…" : "Upload an image"}</span>
          <span className="text-xs">JPG, PNG or WebP · up to 5 MB</span>
        </button>
      )}
    </div>
  );
}

/** A slide-free inline editor panel header with a close button (used instead of cramped modals). */
export function EditorHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <h2 className="font-bold">{title}</h2>
      <Button type="button" size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
    </div>
  );
}

/** Count badge used in the KPI strips at the top of management pages. */
export function StatCard({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "warn" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className={cn("text-2xl font-extrabold tabular-nums", tone === "warn" ? "text-highlight-soft-foreground" : "text-primary-700")}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
