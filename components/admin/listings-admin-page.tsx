"use client";
import Image from "next/image";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState, type FormEvent } from "react";
import { Check, ExternalLink, Package, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, STATUS_TONE, SearchInput, Toolbar, errorMessage, humanize, useConfirm } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { CONDITION_LABELS, timeAgo } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import type { Category } from "@/lib/types";

type AdminListing = {
  id: number; slug: string; title: string; description: string; condition: string; location: string; city: string | null;
  status: string; moderation_status: string; is_demo: boolean;
  category: { id: number; name: string } | null; giver: { id: number; name: string; slug: string } | null;
  image: string | null; requests_count: number; created_at: string; deleted_at: string | null;
};
type Page = { data: AdminListing[]; meta: { current_page: number; last_page: number; total: number } };

const STATUSES = ["available", "reserved", "given_away", "paused", "removed"];

/** Listings ("products"): browse, moderate, edit, delete and restore. Prices can never be set. */
export function AdminListingsPage() {
  const params = useSearchParams();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [moderation, setModeration] = useState(params.get("moderation") ?? "");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminListing | null>(null);
  const search = useDeferredValue(q);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", search, status, moderation, category, page],
    queryFn: () => api.get<Page>("admin/listings", { q: search || undefined, status: status || undefined, moderation: moderation || undefined, category: category || undefined, page }),
    placeholderData: (previous) => previous,
  });
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<{ data: Category[] }>("admin/categories").then((response) => response.data),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
  };
  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => { setter(value); setPage(1); };

  async function moderate(listing: AdminListing, outcome: "approved" | "rejected") {
    try {
      await api.patch(`moderation/listings/${listing.id}`, { moderation_status: outcome, note: null });
      toast.success(outcome === "approved" ? `“${listing.title}” is live` : `“${listing.title}” rejected — the giver was notified`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update listing"));
    }
  }

  async function restore(listing: AdminListing) {
    try {
      await api.post(`admin/listings/${listing.id}/restore`);
      toast.success("Listing restored");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not restore listing"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Listings"
        description="Every free item on Gratis Castle. Approve new listings, fix details, pause or remove anything that breaks the guidelines."
        actions={<Button asChild><Link href="/give" target="_blank"><Plus className="size-4" /> New listing</Link></Button>}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <Toolbar>
          <SearchInput value={q} onChange={resetPage(setQ)} placeholder="Search title or location" />
          <FilterSelect label="Status" value={status} onChange={resetPage(setStatus)}>
            <option value="">All statuses</option>
            {STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
            <option value="deleted">Deleted</option>
          </FilterSelect>
          <FilterSelect label="Moderation" value={moderation} onChange={resetPage(setModeration)}>
            <option value="">Any review state</option>
            <option value="pending">Awaiting approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </FilterSelect>
          <FilterSelect label="Category" value={category} onChange={resetPage(setCategory)}>
            <option value="">All categories</option>
            {categories?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </FilterSelect>
        </Toolbar>

        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={900}
          head={<tr><th>Item</th><th>Giver</th><th>Category</th><th>Status</th><th>Review</th><th className="text-right">Requests</th><th>Listed</th><th className="w-10" /></tr>}
        >
          {data?.data.map((listing) => (
            <tr key={listing.id} className={listing.deleted_at ? "bg-destructive/5" : undefined}>
              <td>
                <div className="flex items-center gap-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {listing.image ? (
                      <Image src={listing.image} alt="" fill sizes="44px" className="object-cover" />
                    ) :<Package className="absolute inset-0 m-auto size-5 text-muted-foreground" />}
                  </span>
                  <div className="min-w-0">
                    <p className="max-w-64 truncate font-semibold">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">{listing.location}{listing.is_demo ? " · Demo" : ""}</p>
                  </div>
                </div>
              </td>
              <td className="text-muted-foreground">{listing.giver?.name ?? "—"}</td>
              <td className="text-muted-foreground">{listing.category?.name ?? "—"}</td>
              <td>{listing.deleted_at ? <Pill tone="red">Deleted</Pill> : <Pill tone={STATUS_TONE[listing.status]}>{humanize(listing.status)}</Pill>}</td>
              <td>
                {listing.moderation_status === "pending" && !listing.deleted_at ? (
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 px-2" onClick={() => void moderate(listing, "approved")}><Check className="size-3.5" /> Approve</Button>
                    <Button size="icon-sm" variant="outline" className="size-7" onClick={() => void moderate(listing, "rejected")} aria-label="Reject"><X className="size-3.5" /></Button>
                  </div>
                ) : <Pill tone={STATUS_TONE[listing.moderation_status]}>{humanize(listing.moderation_status)}</Pill>}
              </td>
              <td className="text-right tabular-nums">{listing.requests_count}</td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(listing.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: "View on site", icon: <ExternalLink className="size-4" />, onSelect: () => window.open(listingPath(listing.slug), "_blank"), hidden: !!listing.deleted_at },
                  { label: "Edit", icon: <Pencil className="size-4" />, onSelect: () => setEditing(listing), hidden: !isAdmin || !!listing.deleted_at },
                  { label: "Restore", icon: <RotateCcw className="size-4" />, onSelect: () => void restore(listing), hidden: !isAdmin || !listing.deleted_at },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin || !!listing.deleted_at,
                    onSelect: () => confirm({
                      title: `Delete “${listing.title}”?`,
                      description: "Open requests are declined and the listing disappears from the site. You can restore it later from the Deleted filter.",
                      action: async () => {
                        try {
                          await api.delete(`admin/listings/${listing.id}`);
                          toast.success("Listing deleted");
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete listing"));
                        }
                      },
                    }),
                  },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </div>

      <EditListingDialog listing={editing} categories={categories ?? []} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      {confirmDialog}
    </div>
  );
}

function EditListingDialog({ listing, categories, onClose, onSaved }: { listing: AdminListing | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [openedFor, setOpenedFor] = useState<AdminListing | null>(null);
  const [busy, setBusy] = useState(false);

  if (listing !== openedFor) {
    setOpenedFor(listing);
    if (listing) {
      setForm({
        title: listing.title, description: listing.description, category_id: String(listing.category?.id ?? ""), condition: listing.condition,
        location: listing.location, city: listing.city ?? "", status: listing.status, moderation_status: listing.moderation_status,
      });
    }
  }

  const set = (key: string) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!listing) return;
    setBusy(true);
    try {
      await api.put(`admin/listings/${listing.id}`, { ...form, category_id: Number(form.category_id), city: form.city || null });
      toast.success("Listing saved");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save listing"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit listing</DialogTitle>
          <DialogDescription>Items are always free — there is no price to set.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title"><Input value={form.title ?? ""} onChange={set("title")} required minLength={3} maxLength={120} /></Field>
          <Field label="Description"><Textarea value={form.description ?? ""} onChange={set("description")} required minLength={10} maxLength={5000} rows={5} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={form.category_id ?? ""} onChange={set("category_id")} required>
                <option value="" disabled>Choose…</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </Field>
            <Field label="Condition">
              <Select value={form.condition ?? ""} onChange={set("condition")}>
                {Object.entries(CONDITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </Field>
            <Field label="General area"><Input value={form.location ?? ""} onChange={set("location")} required maxLength={120} /></Field>
            <Field label="City"><Input value={form.city ?? ""} onChange={set("city")} maxLength={120} /></Field>
            <Field label="Status">
              <Select value={form.status ?? ""} onChange={set("status")}>
                {STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
              </Select>
            </Field>
            <Field label="Review">
              <Select value={form.moderation_status ?? ""} onChange={set("moderation_status")}>
                <option value="pending">Awaiting approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save listing"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
