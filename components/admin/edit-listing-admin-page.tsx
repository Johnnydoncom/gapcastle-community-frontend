"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Eye,
  MapPin,
  Package,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { PageHeader, Panel, Pill, STATUS_TONE, errorMessage, humanize, useConfirm } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
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
  images: Array<{ id: number; url: string }> | null; image: string | null; requests_count: number; created_at: string; deleted_at: string | null;
};

const STATUSES = ["available", "reserved", "given_away", "paused", "removed"];

export function AdminEditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();

  const { data: listing, isLoading: loadingListing, error: listingError } = useQuery({
    queryKey: ["admin-listing", listingId],
    queryFn: () => api.get<{ data: AdminListing }>(`admin/listings/${listingId}`).then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<{ data: Category[] }>("admin/categories").then((r) => r.data),
  });

  async function handleDelete() {
    if (!listing) return;
    confirm({
      title: `Delete "${listing.title}"?`,
      description: "Open requests are declined and the listing disappears from the site. You can restore it later from the Deleted filter.",
      action: async () => {
        try {
          await api.delete(`admin/listings/${listing.id}`);
          toast.success("Listing deleted.");
          queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
          router.push("/admin/listings");
        } catch (err) {
          toast.error(errorMessage(err, "Could not delete listing."));
        }
      },
    });
  }

  async function moderate(outcome: "approved" | "rejected") {
    if (!listing) return;
    try {
      await api.patch(`moderation/listings/${listing.id}`, { moderation_status: outcome, note: null });
      toast.success(outcome === "approved" ? `"${listing.title}" is now live.` : `"${listing.title}" rejected — the giver was notified.`);
      queryClient.invalidateQueries({ queryKey: ["admin-listing", listingId] });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
    } catch (err) {
      toast.error(errorMessage(err, "Could not update listing."));
    }
  }

  if (loadingListing) {
    return (
      <div className="max-w-4xl">
        <div className="mb-6 h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-[500px] animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/listings"><ArrowLeft className="size-4" /> Back to listings</Link>
          </Button>
        </div>
        <Panel className="p-8 text-center space-y-3">
          <p className="text-base font-semibold text-foreground">Listing not found</p>
          <p className="text-sm text-muted-foreground">
            {listingError ? errorMessage(listingError, "Could not load listing data.") : `No listing exists with ID #${listingId}.`}
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/listings">Return to listings table</Link>
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  const images = listing.images ?? (listing.image ? [{ id: 0, url: listing.image }] : []);
  const isDeleted = !!listing.deleted_at;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/listings"><ArrowLeft className="size-4" /> Back to listings</Link>
        </Button>
      </div>

      <PageHeader
        title={`Edit: ${listing.title}`}
        description="Items are free — there is no price to set."
        actions={
          <div className="flex gap-2">
            {!isDeleted && (
              <Button asChild variant="outline" size="sm">
                <Link href={listingPath(listing.slug)} target="_blank"><Eye className="size-4" /> View on site</Link>
              </Button>
            )}
          </div>
        }
      />

      {/* Moderation banner */}
      {listing.moderation_status === "pending" && !isDeleted && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-yellow-200 bg-highlight-soft px-5 py-4">
          <div>
            <p className="font-semibold text-highlight-soft-foreground">This listing is awaiting review</p>
            <p className="text-sm text-highlight-soft-foreground/80">Approve it to make it visible on the marketplace, or reject it.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void moderate("approved")}><Check className="size-4" /> Approve</Button>
            <Button size="sm" variant="outline" onClick={() => void moderate("rejected")}><X className="size-4" /> Reject</Button>
          </div>
        </div>
      )}

      {isDeleted && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <p className="font-semibold text-destructive">This listing has been deleted</p>
          <p className="text-sm text-destructive/80">You can restore it from the listings table.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main form */}
        <ListingEditForm
          key={listing.id}
          listing={listing}
          categories={categories ?? []}
          isAdmin={isAdmin}
          isDeleted={isDeleted}
          onDelete={handleDelete}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
            queryClient.invalidateQueries({ queryKey: ["admin-listing", listingId] });
            queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
            router.push("/admin/listings");
          }}
        />

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Photos */}
          <Panel title="Photos">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {images.map((img) => (
                  <div key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                    <Image src={img.url} alt="" fill sizes="160px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl bg-muted px-4 py-8 text-center">
                <Package className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No photos</p>
              </div>
            )}
          </Panel>

          {/* Quick info */}
          <Panel title="Info">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-muted-foreground"><span className="text-xs font-bold uppercase tracking-wider">ID</span></dt>
                <dd className="font-mono text-xs">{listing.id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>{isDeleted ? <Pill tone="red">Deleted</Pill> : <Pill tone={STATUS_TONE[listing.status]}>{humanize(listing.status)}</Pill>}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Review</dt>
                <dd><Pill tone={STATUS_TONE[listing.moderation_status]}>{humanize(listing.moderation_status)}</Pill></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" /> Location</dt>
                <dd>{listing.location}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground"><Users className="size-3.5" /> Requests</dt>
                <dd className="font-semibold">{listing.requests_count}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="size-3.5" /> Listed</dt>
                <dd>{timeAgo(listing.created_at)}</dd>
              </div>
              {listing.giver && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Giver</dt>
                  <dd>
                    <Link href={`/users/${listing.giver.slug}`} target="_blank" className="font-semibold text-primary hover:underline">
                      {listing.giver.name}
                    </Link>
                  </dd>
                </div>
              )}
              {listing.is_demo && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd><Pill tone="blue">Demo</Pill></dd>
                </div>
              )}
            </dl>
          </Panel>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
}

type ListingEditFormProps = {
  listing: AdminListing;
  categories: Category[];
  isAdmin: boolean;
  isDeleted: boolean;
  onDelete: () => void;
  onSaved: () => void;
};

/** Owns the editable form values so they seed directly from the loaded listing. */
function ListingEditForm({ listing, categories, isAdmin, isDeleted, onDelete, onSaved }: ListingEditFormProps) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => ({
    title: listing.title,
    description: listing.description,
    category_id: String(listing.category?.id ?? ""),
    condition: listing.condition,
    location: listing.location,
    city: listing.city ?? "",
    status: listing.status,
    moderation_status: listing.moderation_status,
  }));

  const set = (key: string) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.put(`admin/listings/${listing.id}`, {
        ...form,
        category_id: Number(form.category_id),
        city: form.city || null,
      });
      toast.success("Listing saved successfully.");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save listing."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Panel title="Listing details">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input value={form.title ?? ""} onChange={set("title")} required minLength={3} maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <RichTextEditor value={form.description ?? ""} onChange={(html) => setForm((current) => ({ ...current, description: html }))} placeholder="Describe the item" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={form.category_id ?? ""} onChange={set("category_id")} required>
                <option value="" disabled>Choose…</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Condition</label>
              <Select value={form.condition ?? ""} onChange={set("condition")}>
                {Object.entries(CONDITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">General area</label>
              <Input value={form.location ?? ""} onChange={set("location")} required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">City</label>
              <Input value={form.city ?? ""} onChange={set("city")} maxLength={120} placeholder="Optional" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status ?? ""} onChange={set("status")}>
                {STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Review status</label>
              <Select value={form.moderation_status ?? ""} onChange={set("moderation_status")}>
                <option value="pending">Awaiting approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          {isAdmin && !isDeleted && (
            <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete listing
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button asChild type="button" variant="ghost">
              <Link href="/admin/listings">Cancel</Link>
            </Button>
            <Button type="submit" disabled={busy || isDeleted || !isAdmin}>
              <Save className="size-4" /> {busy ? "Saving…" : "Save listing"}
            </Button>
          </div>
        </div>
      </Panel>
    </form>
  );
}
