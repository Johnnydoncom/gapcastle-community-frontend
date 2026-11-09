"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, MessageCircle, Package, PackageSearch, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { RequestStatusBadge } from "@/components/account/status-badges";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";
import type { ItemRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "open", label: "Open", match: ["pending", "accepted"] },
  { value: "completed", label: "Received", match: ["completed"] },
  { value: "closed", label: "Closed", match: ["declined", "cancelled"] },
  { value: "all", label: "All", match: [] as string[] },
];

export function MyRequestsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("open");
  const [busy, setBusy] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["my-requests"], queryFn: async () => (await api.get<{ data: ItemRequest[] }>("me/requests")).data });

  const active = FILTERS.find((f) => f.value === filter)!;
  const rows = (data ?? []).filter((r) => filter === "all" || active.match.includes(r.status));

  async function act(request: ItemRequest, path: string, success: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(request.id);
    try {
      await api.post(`requests/${request.id}/${path}`);
      toast.success(success);
      void queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeading eyebrow="My requests" title="Items you've asked for" description="Follow each request, chat with givers and confirm arrangements." />
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" onClick={() => setFilter(option.value)} aria-pressed={filter === option.value}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40")}>
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</div> : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <PackageSearch className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-semibold">No requests here</p>
          <p className="mt-1 text-sm text-muted-foreground">Find something useful and send a friendly request.</p>
          <Button asChild variant="outline" className="mt-4"><Link href="/explore">Explore free items</Link></Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((request) => {
            const listing = request.listing;
            const giver = listing?.giver;
            const delivery = request.delivery;
            return (
              <li key={request.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex gap-4">
                  <Link href={listing ? listingPath(listing.slug) : "/explore"} className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element -- listing photo */}
                    {listing?.images?.[0] ? <img src={listing.images[0].url} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-2xl">📦</div>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <RequestStatusBadge status={request.status} />
                      <span className="text-xs text-muted-foreground">Requested {timeAgo(request.created_at)}</span>
                    </div>
                    <Link href={listing ? listingPath(listing.slug) : "/explore"} className="mt-1 line-clamp-1 font-semibold hover:text-primary">{listing?.title ?? "Item"}</Link>
                    {giver && (
                      <Link href={profilePath(giver.slug)} className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                        <Avatar url={giver.avatar_url} name={giver.name} className="size-5 text-[9px]" /> {giver.name}
                      </Link>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      {request.fulfillment_method === "delivery" ? <Truck className="size-4" /> : <Package className="size-4" />}
                      <span>
                        {request.fulfillment_method === "pickup"
                          ? `Pickup${request.pickup_location ? ` at ${request.pickup_location.name}, ${request.pickup_location.area}` : ""}`
                          : `Waybill${request.recipient?.delivery_city ? ` to ${request.recipient.delivery_city}` : ""}${request.state ? `, ${request.state.name}` : ""}`}
                      </span>
                      {request.preferred_arrangement && <span>· {request.preferred_arrangement}</span>}
                    </p>
                  </div>
                </div>
                {delivery && request.status === "accepted" && (
                  <div className="mt-3 rounded-xl border border-border bg-cream p-3 text-sm">
                    <p className="font-semibold">Delivery arrangement</p>
                    <p className="mt-1 text-muted-foreground">
                      {delivery.fee_amount ? <>Transport cost <strong className="text-foreground">₦{delivery.fee_amount.toLocaleString()}</strong> ({delivery.fee_payer} pays). This covers delivery only — the item is free.</> : "Delivery at no cost."}
                      {delivery.notes && <> · {delivery.notes}</>}
                    </p>
                    {!delivery.receiver_confirmed_at ? (
                      <Button size="sm" className="mt-2" disabled={busy === request.id} onClick={() => act(request, "delivery/confirm", "Delivery arrangement confirmed")}><CheckCircle2 className="size-4" /> Confirm arrangement</Button>
                    ) : <p className="mt-1 text-xs font-semibold text-primary">You confirmed this arrangement.</p>}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {request.conversation_id && <Button size="sm" variant="outline" asChild><Link href={`/account/messages?conversationId=${request.conversation_id}`}><MessageCircle className="size-4" /> Open chat</Link></Button>}
                  {(request.status === "pending" || request.status === "accepted") && (
                    <Button size="sm" variant="ghost" disabled={busy === request.id} onClick={() => act(request, "cancel", "Request cancelled", "Cancel this request?")}>Cancel request</Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
