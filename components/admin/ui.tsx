"use client";

import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Shared building blocks for every admin screen, so the dashboard feels like one product. */

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
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

export function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: ReactNode }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 cursor-pointer rounded-lg border border-input bg-card px-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring/30"
    >
      {children}
    </select>
  );
}

export function DataTable({ head, children, empty, loading, minWidth = 760 }: { head: ReactNode; children: ReactNode; empty?: boolean; loading?: boolean; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead className="bg-muted/60 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground [&_th]:px-4 [&_th]:py-2.5">
          {head}
        </thead>
        <tbody className="divide-y divide-border [&_td]:px-4 [&_td]:py-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}><td colSpan={20}><div className="h-6 animate-pulse rounded bg-muted" /></td></tr>
            ))
          ) : children}
        </tbody>
      </table>
      {!loading && empty && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nothing matches these filters.</p>}
    </div>
  );
}

export function Pagination({ page, lastPage, total, onPage }: { page: number; lastPage: number; total: number; onPage: (page: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
      <span>{total.toLocaleString("en-NG")} result{total === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></Button>
        <span>Page {page} of {Math.max(1, lastPage)}</span>
        <Button size="icon-sm" variant="outline" disabled={page >= lastPage} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></Button>
      </div>
    </div>
  );
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
};

export function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/^\w/, (char) => char.toUpperCase());
}

export function RowActions({ items }: { items: Array<{ label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; hidden?: boolean } | "separator"> }) {
  const visible = items.filter((item) => item === "separator" || !item.hidden);
  if (!visible.some((item) => item !== "separator")) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label="Actions"><MoreHorizontal className="size-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {visible.map((item, index) =>
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

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
