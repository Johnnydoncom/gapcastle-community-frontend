"use client";
import Image from "next/image";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronDown, Eye, Gift, MessageCircle, MoreHorizontal, Pause, Pencil, Play, Bookmark as Reserve, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { ListingStatusBadge, RequestStatusBadge } from "@/components/account/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError, api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";
import type { ItemRequest, Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Active" },
  { value: "reserved", label: "Reserved" },
  { value: "given_away", label: "Given away" },
  { value: "paused", label: "Paused" },
];

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

export function MyListingsPage() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(params.get("listing") ? Number(params.get("listing")) : null);
  const { data, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: async () => (await api.get<{ data: Listing[] }>("me/listings")).data });

  const listings = (data ?? []).filter((listing) => filter === "all" || listing.status === filter);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    void queryClient.invalidateQueries({ queryKey: ["explore"] });
  };

  async function setStatus(listing: Listing, status: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    try {
      await api.patch(`listings/${listing.id}/status`, { status });
      toast.success("Listing updated");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update listing"));
    }
  }

  async function remove(listing: Listing) {
    if (!confirm(`Delete “${listing.title}”? Any open requests will be declined. This can't be undone.`)) return;
    try {
      await api.delete(`listings/${listing.id}`);
      toast.success("Listing deleted");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete listing"));
    }
  }

  return (
    <div>
      <PageHeading eyebrow="My listings" title="Items you're giving away" description="Manage your listings and choose who receives each item." action={<Button asChild><Link href="/give"><Gift className="size-4" /> Give an item</Link></Button>} />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" onClick={() => setFilter(option.value)} aria-pressed={filter === option.value}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40")}>
            {option.label}
            {data && <span className="ml-1 opacity-70">{option.value === "all" ? data.length : data.filter((l) => l.status === option.value).length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div> : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-semibold">{data?.length ? "No listings with this status." : "Nothing listed yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">A good item can make someone’s day.</p>
          <Button asChild className="mt-4" variant="highlight"><Link href="/give">Give an item</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const isOpen = expanded === listing.id;
            const pending = listing.pending_request_count ?? 0;
            const closed = listing.status === "given_away";
            return (
              <article key={listing.id} className={cn("overflow-hidden rounded-2xl border bg-card shadow-soft transition-colors", isOpen ? "border-primary/40" : "border-border")}>
                <div className="flex gap-4 p-4">
                  <Link href={listingPath(listing.slug)} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                    {listing.images?.[0] ? <Image src={listing.images[0].url} alt="" fill sizes="96px" className="object-cover" /> : <div className="flex size-full items-center justify-center text-2xl">📦</div>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ListingStatusBadge status={listing.status} moderation={listing.moderation_status} />
                      {listing.is_demo && <Badge variant="muted">Demo</Badge>}
                      <span className="text-xs text-muted-foreground">Listed {timeAgo(listing.created_at)}</span>
                    </div>
                    <Link href={listingPath(listing.slug)} className="mt-1 line-clamp-1 font-semibold hover:text-primary">{listing.title}</Link>
                    <p className="text-sm text-muted-foreground">{[listing.location, listing.city].filter(Boolean).join(", ")}</p>
                    <button type="button" onClick={() => setExpanded(isOpen ? null : listing.id)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary" aria-expanded={isOpen}>
                      <Users className="size-4" /> {listing.request_count} request{listing.request_count === 1 ? "" : "s"}
                      {pending > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{pending} new</span>}
                      <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${listing.title}`}><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild><Link href={listingPath(listing.slug)} className="cursor-pointer"><Eye className="size-4" /> View listing</Link></DropdownMenuItem>
                      {!closed && <DropdownMenuItem asChild><Link href={`/account/listings/${listing.id}/edit`} className="cursor-pointer"><Pencil className="size-4" /> Edit</Link></DropdownMenuItem>}
                      {listing.status === "available" && <DropdownMenuItem onSelect={() => setStatus(listing, "paused")}><Pause className="size-4" /> Pause listing</DropdownMenuItem>}
                      {listing.status === "paused" && <DropdownMenuItem onSelect={() => setStatus(listing, "available")}><Play className="size-4" /> Resume listing</DropdownMenuItem>}
                      {listing.status === "available" && <DropdownMenuItem onSelect={() => setStatus(listing, "reserved")}><Reserve className="size-4" /> Mark as reserved</DropdownMenuItem>}
                      {listing.status === "reserved" && <DropdownMenuItem onSelect={() => setStatus(listing, "available")}><Play className="size-4" /> Make available again</DropdownMenuItem>}
                      {!closed && <DropdownMenuItem onSelect={() => setStatus(listing, "given_away", "Mark this item as given away? Any open requests will be declined.")}><Check className="size-4" /> Mark as given away</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => remove(listing)} className="text-destructive focus:text-destructive"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {isOpen && <IncomingRequests listing={listing} onChange={refresh} />}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IncomingRequests({ listing, onChange }: { listing: Listing; onChange: () => void }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["incoming", listing.id],
    queryFn: async () => (await api.get<{ data: ItemRequest[] }>(`listings/${listing.id}/requests`)).data,
  });

  async function act(request: ItemRequest, action: "accept" | "decline" | "complete", confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(request.id);
    try {
      const response = await api.post<{ message: string }>(`requests/${request.id}/${action}`);
      toast.success(response.message);
      void queryClient.invalidateQueries({ queryKey: ["incoming", listing.id] });
      onChange();
    } catch (err) {
      toast.error(errorMessage(err, "Something went wrong"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border-t border-border bg-cream/60 p-4">
      {isLoading ? <div className="h-20 animate-pulse rounded-xl bg-muted" /> : !data?.length ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No requests yet. We&apos;ll notify you as soon as someone asks.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((request) => {
            const open = request.status === "pending" || request.status === "accepted";
            const delivery = request.delivery;
            return (
              <li key={request.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar url={request.requester?.avatar_url} name={request.requester?.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={profilePath(request.requester?.slug ?? "")} className="font-semibold hover:text-primary">{request.requester?.name}</Link>
                      <RequestStatusBadge status={request.status} />
                      <span className="text-xs text-muted-foreground">{timeAgo(request.created_at)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {request.requester?.trust.email_verified ? "Email verified · " : ""}{request.requester?.trust.items_shared ?? 0} item(s) rehomed · wants <strong>{request.fulfillment_method === "pickup" ? "hub pickup" : "waybill"}</strong>
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm">{request.introduction}</p>
                    {request.reason && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Why: </span>{request.reason}</p>}
                    {request.preferred_arrangement && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Preferred: </span>{request.preferred_arrangement}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Collection: </span>
                      {request.fulfillment_method === "pickup"
                        ? `Gap Castle hub${request.pickup_location ? ` — ${request.pickup_location.name}, ${request.pickup_location.area}` : ""}`
                        : `Waybill to ${request.state?.name ?? "Nigeria"}`}
                    </p>
                    {request.status === "accepted" && (
                      <p className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
                        The Gap Castle team will contact you to arrange the drop-off at a pickup hub. You never need to meet the receiver or share your address.
                      </p>
                    )}
                    {delivery && (
                      <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        Delivery: {delivery.fee_amount ? `₦${delivery.fee_amount.toLocaleString()} transport cost (${delivery.fee_payer} pays)` : "no cost"} ·{" "}
                        {delivery.receiver_confirmed_at ? "confirmed by receiver" : "waiting for receiver to confirm"}
                      </p>
                    )}
                  </div>
                </div>
                {(open || request.conversation_id) && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                    {request.status === "pending" && (
                      <Button size="sm" disabled={busy === request.id || listing.status !== "available"} onClick={() => act(request, "accept")}><Check className="size-4" /> Accept</Button>
                    )}
                    {request.status === "accepted" && (
                      <Button size="sm" variant="highlight" disabled={busy === request.id} onClick={() => act(request, "complete", `Confirm ${request.requester?.name} has received the item? Other requests will be declined.`)}>
                        <Gift className="size-4" /> Mark as given away
                      </Button>
                    )}
                    {request.conversation_id && (
                      <Button size="sm" variant="outline" asChild><Link href={`/account/messages?conversationId=${request.conversation_id}`}><MessageCircle className="size-4" /> Message</Link></Button>
                    )}
                    {open && (
                      <Button size="sm" variant="ghost" disabled={busy === request.id} onClick={() => act(request, "decline", "Decline this request? The requester will be notified kindly.")}><X className="size-4" /> Decline</Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {listing.status === "reserved" && data?.some((r) => r.status === "pending") && (
        <p className="mt-3 text-xs text-muted-foreground">This item is reserved. Decline or complete the accepted request before accepting another.</p>
      )}
    </div>
  );
}

