"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bike, Clock, Eye, Gift, Lock, MapPin, MessageCircle, MoreHorizontal, Package, Pause, Pencil, Phone, Play, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { OrderTimeline } from "@/components/account/order-timeline";
import { ListingStatusBadge } from "@/components/account/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ApiError, api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import type { ItemRequest, Listing, NgState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = { value: string; label: string; test: (listing: Listing) => boolean };

const FILTERS: Filter[] = [
  { value: "all", label: "All", test: () => true },
  { value: "available", label: "Active", test: (l) => l.status === "available" && l.moderation_status !== "pending" },
  { value: "claimed", label: "Claimed", test: (l) => l.status === "reserved" },
  { value: "given_away", label: "Given away", test: (l) => l.status === "given_away" },
  { value: "review", label: "In review", test: (l) => l.moderation_status === "pending" || l.moderation_status === "rejected" },
  { value: "paused", label: "Paused", test: (l) => l.status === "paused" },
];

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

/**
 * "My listings": everything the member is giving away. Nobody approves requests —
 * the first member to check out gets the item — so claimed items show who got
 * them, the order's progress and exactly how to hand the item to Gratis Castle.
 */
export function MyListingsPage() {
  const params = useSearchParams();
  const focusId = Number(params.get("listing")) || null;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const { data, isLoading } = useQuery({ queryKey: ["my-listings"], queryFn: async () => (await api.get<{ data: Listing[] }>("me/listings")).data });
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: async () => (await api.get<{ data: NgState[] }>("states")).data,
    staleTime: 5 * 60_000,
  });

  const all = data ?? [];
  const active = FILTERS.find((option) => option.value === filter)!;
  const listings = all.filter(active.test);

  useEffect(() => {
    if (focusId && data) requestAnimationFrame(() => document.getElementById(`listing-${focusId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [focusId, data]);

  const refresh = () => {
    for (const key of ["my-listings", "explore", "home-listings"]) void queryClient.invalidateQueries({ queryKey: [key] });
  };

  async function setStatus(listing: Listing, status: "available" | "paused") {
    try {
      await api.patch(`listings/${listing.id}/status`, { status });
      toast.success(status === "paused" ? "Listing paused" : "Listing is live again");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update listing"));
    }
  }

  async function remove(listing: Listing) {
    if (!confirm(`Delete “${listing.title}”? This can't be undone.`)) return;
    try {
      await api.delete(`listings/${listing.id}`);
      toast.success("Listing deleted");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete listing"));
    }
  }

  const stats = [
    { label: "Active", value: all.filter(FILTERS[1].test).length },
    { label: "Claimed", value: all.filter(FILTERS[2].test).length, highlight: all.some(FILTERS[2].test) },
    { label: "Given away", value: all.filter(FILTERS[3].test).length },
    { label: "In review", value: all.filter(FILTERS[4].test).length },
  ];

  return (
    <div>
      <PageHeading
        eyebrow="My listings"
        title="Items you're giving away"
        description="The first member to check out gets your item. Follow each handover here."
        action={<Button asChild><Link href="/give"><Gift className="size-4" /> Give an item</Link></Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("rounded-2xl border bg-card p-3 sm:p-4", stat.highlight ? "border-primary/40 bg-primary-50/50" : "border-border")}>
            <p className="text-xl font-extrabold sm:text-2xl">{isLoading ? "–" : stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter listings">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" role="tab" aria-selected={filter === option.value} onClick={() => setFilter(option.value)}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40")}>
            {option.label}
            {data && <span className="ml-1 opacity-70">{all.filter(option.test).length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-semibold">{all.length ? "No listings here." : "Nothing listed yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">A good item can make someone’s day.</p>
          <Button asChild className="mt-4" variant="highlight"><Link href="/give">Give an item</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const claimed = listing.status === "reserved";
            const given = listing.status === "given_away";
            const locked = claimed || given;
            return (
              <article key={listing.id} id={`listing-${listing.id}`} className={cn("scroll-mt-32 overflow-hidden rounded-2xl border bg-card shadow-soft", listing.id === focusId ? "border-primary ring-2 ring-primary/20" : "border-border")}>
                <div className="flex gap-4 p-4">
                  <Link href={listingPath(listing.slug)} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
                    {listing.images?.[0] ? <Image src={listing.images[0].url} alt="" fill sizes="96px" className="object-cover" /> : <Package className="absolute inset-0 m-auto size-7 text-primary-300" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ListingStatusBadge status={listing.status} moderation={listing.moderation_status} owner />
                      {listing.is_demo && <Badge variant="muted">Demo</Badge>}
                      <span className="text-xs text-muted-foreground">Listed {timeAgo(listing.created_at)}</span>
                    </div>
                    <Link href={listingPath(listing.slug)} className="mt-1 line-clamp-1 font-semibold hover:text-primary">{listing.title}</Link>
                    <p className="text-sm text-muted-foreground">{[listing.location, listing.city, listing.state?.name].filter(Boolean).join(", ")}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {listing.handover_method === "dispatch_pickup" ? <><Bike className="size-3.5" /> Dispatch pickup from you</> : <><Store className="size-3.5" /> You drop it at our hub</>}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${listing.title}`}><MoreHorizontal className="size-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild><Link href={listingPath(listing.slug)} className="cursor-pointer"><Eye className="size-4" /> View listing</Link></DropdownMenuItem>
                      {!given && <DropdownMenuItem asChild><Link href={`/account/listings/${listing.id}/edit`} className="cursor-pointer"><Pencil className="size-4" /> {claimed ? "Correct details" : "Edit"}</Link></DropdownMenuItem>}
                      {!locked && listing.status === "available" && <DropdownMenuItem onSelect={() => setStatus(listing, "paused")}><Pause className="size-4" /> Pause listing</DropdownMenuItem>}
                      {!locked && listing.status === "paused" && <DropdownMenuItem onSelect={() => setStatus(listing, "available")}><Play className="size-4" /> Resume listing</DropdownMenuItem>}
                      {!locked && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => remove(listing)} className="text-destructive focus:text-destructive"><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {locked && <HandoverPanel listing={listing} states={states ?? []} />}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** For a claimed (or given-away) item: the order, its progress and the giver's next step. */
function HandoverPanel({ listing, states }: { listing: Listing; states: NgState[] }) {
  const { data, isLoading } = useQuery({
    queryKey: ["incoming", listing.id],
    queryFn: async () => (await api.get<{ data: ItemRequest[] }>(`listings/${listing.id}/requests`)).data,
  });

  const order = data?.find((item) => item.status === "accepted" || item.status === "completed");
  const hubs = states.find((state) => state.id === listing.state?.id)?.pickup_locations ?? [];
  const awaitingHandover = order?.status === "accepted" && (order.fulfillment_stage === "awaiting_handover" || order.fulfillment_stage === null);

  if (isLoading) return <div className="border-t border-border p-4"><div className="h-16 animate-pulse rounded-xl bg-muted" /></div>;
  if (!order) return null;

  return (
    <div className="space-y-4 border-t border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p>
          <strong>{order.requester?.name ?? "A member"}</strong> got this item · <span className="text-muted-foreground">Order {order.order_number}</span>
        </p>
        {order.conversation_id && (
          <Button size="sm" variant="outline" asChild><Link href={`/account/messages?conversationId=${order.conversation_id}`}><MessageCircle className="size-4" /> Message</Link></Button>
        )}
      </div>

      <OrderTimeline steps={order.timeline} />

      {awaitingHandover && (
        <div className="rounded-xl border border-primary-200 bg-card p-4 text-sm">
          <p className="font-bold text-primary-800">Your next step</p>
          {listing.handover_method === "dispatch_pickup" ? (
            <p className="mt-1 text-muted-foreground">
              Our dispatch rider will call {listing.handover?.pickup_phone ? <strong className="text-foreground">{listing.handover.pickup_phone}</strong> : "you"} to collect the item
              {listing.handover?.pickup_address ? <> from <strong className="text-foreground">{listing.handover.pickup_address}</strong></> : null}
              {listing.handover?.pickup_times ? <> ({listing.handover.pickup_times})</> : null}. Please have it ready and packed.
            </p>
          ) : hubs.length ? (
            <div className="mt-2 space-y-2">
              <p className="text-muted-foreground">Please drop the item at the Gratis Castle hub and mention order <strong className="text-foreground">{order.order_number}</strong>:</p>
              {hubs.map((hub) => (
                <div key={hub.id} className="rounded-lg bg-muted/60 px-3 py-2">
                  <p className="flex items-center gap-1.5 font-semibold"><MapPin className="size-3.5 text-primary" /> {hub.name}</p>
                  <p className="text-muted-foreground">{hub.address}, {hub.area}{hub.landmark ? ` (${hub.landmark})` : ""}</p>
                  <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {hub.opening_hours && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {hub.opening_hours}</span>}
                    {hub.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" /> {hub.phone}</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-muted-foreground">The Gratis Castle team will contact you to arrange the drop-off.</p>
          )}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        You never meet the receiver, and their contact details stay private. Never accept or ask for money — Gratis Castle handles the handover.
      </p>
    </div>
  );
}
