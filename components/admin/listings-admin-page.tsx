"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Check, ExternalLink, Eye, Package, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, FilterSelect, PageHeader, Pagination, Pill, STATUS_TONE, SearchInput, Toolbar, errorMessage, humanize, useConfirm } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      toast.success(outcome === "approved" ? `"${listing.title}" is live` : `"${listing.title}" rejected — the giver was notified`);
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

  function deleteListing(listing: AdminListing) {
    confirm({
      title: `Delete "${listing.title}"?`,
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
    });
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
          minWidth={1000}
          head={
            <tr>
              <th>Item</th>
              <th>Giver</th>
              <th>Category</th>
              <th>Status</th>
              <th>Review</th>
              <th className="text-right">Requests</th>
              <th>Listed</th>
              <th className="text-right">Actions</th>
            </tr>
          }
        >
          {data?.data.map((listing) => (
            <tr key={listing.id} className={cn("group transition-colors hover:bg-muted/30", listing.deleted_at && "bg-destructive/5")}>
              {/* Item cell */}
              <td>
                <Link href={`/admin/listings/${listing.id}/edit`} className="flex items-center gap-3 hover:opacity-80">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                    {listing.image ? (
                      <Image src={listing.image} alt="" fill sizes="48px" className="object-cover" />
                    ) : <Package className="absolute inset-0 m-auto size-5 text-muted-foreground" />}
                  </span>
                  <div className="min-w-0">
                    <p className="max-w-56 truncate font-semibold text-foreground group-hover:text-primary">{listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {listing.location}
                      {listing.is_demo ? " · Demo" : ""}
                      {listing.city ? ` · ${listing.city}` : ""}
                    </p>
                  </div>
                </Link>
              </td>

              {/* Giver */}
              <td>
                {listing.giver ? (
                  <Link href={`/users/${listing.giver.slug}`} target="_blank" className="text-sm text-foreground/80 hover:text-primary hover:underline">
                    {listing.giver.name}
                  </Link>
                ) : <span className="text-muted-foreground">—</span>}
              </td>

              {/* Category */}
              <td>
                {listing.category ? (
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                    {listing.category.name}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </td>

              {/* Status */}
              <td>
                {listing.deleted_at
                  ? <Pill tone="red">Deleted</Pill>
                  : <Pill tone={STATUS_TONE[listing.status]}>{humanize(listing.status)}</Pill>
                }
              </td>

              {/* Review */}
              <td>
                {listing.moderation_status === "pending" && !listing.deleted_at ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      className="h-7 gap-1 px-2.5 text-xs"
                      onClick={() => void moderate(listing, "approved")}
                    >
                      <Check className="size-3" /> Approve
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="size-7"
                      onClick={() => void moderate(listing, "rejected")}
                      aria-label="Reject"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Pill tone={STATUS_TONE[listing.moderation_status]}>{humanize(listing.moderation_status)}</Pill>
                )}
              </td>

              {/* Requests count */}
              <td className="text-right">
                <span className={cn(
                  "inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                  listing.requests_count > 0 ? "bg-primary-50 text-primary-700" : "text-muted-foreground",
                )}>
                  {listing.requests_count}
                </span>
              </td>

              {/* Listed */}
              <td className="whitespace-nowrap text-sm text-muted-foreground">{timeAgo(listing.created_at)}</td>

              {/* Action buttons */}
              <td>
                <div className="flex items-center justify-end gap-1">
                  {!listing.deleted_at && (
                    <>
                      {/* View on site */}
                      <Button
                        asChild
                        size="icon-sm"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-foreground"
                      >
                        <Link href={listingPath(listing.slug)} target="_blank" aria-label="View on site">
                          <Eye className="size-4" />
                        </Link>
                      </Button>

                      {/* Edit — navigates to separate page */}
                      {isAdmin && (
                        <Button
                          asChild
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-primary"
                        >
                          <Link href={`/admin/listings/${listing.id}/edit`} aria-label="Edit listing">
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                      )}

                      {/* Delete */}
                      {isAdmin && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteListing(listing)}
                          aria-label="Delete listing"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </>
                  )}

                  {/* Restore */}
                  {listing.deleted_at && isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2.5 text-xs"
                      onClick={() => void restore(listing)}
                    >
                      <RotateCcw className="size-3" /> Restore
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </div>
      {confirmDialog}
    </div>
  );
}
