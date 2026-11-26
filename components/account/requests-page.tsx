"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Clock, Loader2, MapPin, MessageCircle, Package, PackageCheck, PackageSearch, Phone, ShieldCheck, Star, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { OrderTimeline } from "@/components/account/order-timeline";
import { RequestStatusBadge } from "@/components/account/status-badges";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/form-fields";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import { NO_HIDDEN_FEE } from "@/lib/content";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import type { ItemRequest } from "@/lib/types";
import { cn, formatNaira } from "@/lib/utils";

const FILTERS = [
  { value: "open", label: "In progress", match: ["accepted"] },
  { value: "completed", label: "Received", match: ["completed"] },
  { value: "closed", label: "Cancelled", match: ["declined", "cancelled", "pending"] },
  { value: "all", label: "All", match: [] as string[] },
];

/**
 * "My orders": every free item the member has checked out, with live tracking,
 * pickup or delivery details, and the receiver's own actions — cancel before
 * handover, confirm receipt, then review the giver.
 */
export function MyRequestsPage() {
  const params = useSearchParams();
  const focusId = Number(params.get("order")) || null;
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [chosenFilter, setFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["my-requests"], queryFn: async () => (await api.get<{ data: ItemRequest[] }>("me/requests")).data });

  const orders = data ?? [];
  // A deep link (?order=ID) from a notification opens the tab that order is in.
  const focused = focusId ? orders.find((order) => order.id === focusId) : undefined;
  const filter = chosenFilter ?? FILTERS.find((option) => focused && option.match.includes(focused.status))?.value ?? "open";
  const active = FILTERS.find((option) => option.value === filter)!;
  const visible = orders.filter((order) => active.match.length === 0 || active.match.includes(order.status));

  useEffect(() => {
    if (focused) requestAnimationFrame(() => document.getElementById(`order-${focused.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [focused]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["my-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  async function act(order: ItemRequest, path: "cancel" | "receive", success: string, confirmText: string) {
    if (!confirm(confirmText)) return;
    setBusy(`${order.id}:${path}`);
    try {
      await api.post(`requests/${order.id}/${path}`);
      toast.success(success);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const inProgress = orders.filter((order) => order.status === "accepted").length;
  const toConfirm = orders.filter((order) => order.can_confirm_receipt).length;

  return (
    <div>
      <PageHeading
        eyebrow="My orders"
        title="Items you're getting"
        description="Track each free item from checkout to your door or the hub, and confirm when it arrives."
        action={<Button asChild variant="outline"><Link href="/explore"><PackageSearch className="size-4" /> Find more items</Link></Button>}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="In progress" value={inProgress} />
        <Stat label="To confirm" value={toConfirm} highlight={toConfirm > 0} />
        <Stat label="This month" value={`${user?.claims?.this_month ?? 0}/${user?.claims?.monthly_limit ?? 3}`} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" role="tab" aria-selected={filter === option.value} onClick={() => setFilter(option.value)}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold transition", filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40")}>
            {option.label}
            <span className="ml-1 opacity-70">{option.match.length ? orders.filter((order) => option.match.includes(order.status)).length : orders.length}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Package className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-semibold">{orders.length ? "No orders here." : "No orders yet"}</p>
          <p className="mt-1 text-sm text-muted-foreground">Find something useful — every item is free, and so is collecting it from our hub.</p>
          <Button asChild className="mt-4"><Link href="/explore">Explore free items</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <OrderCard key={order.id} order={order} highlighted={order.id === focusId} busy={busy} onAct={act} onReviewed={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-3 sm:p-4", highlight ? "border-primary/40 bg-primary-50/50" : "border-border")}>
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function OrderCard({ order, highlighted, busy, onAct, onReviewed }: {
  order: ItemRequest;
  highlighted: boolean;
  busy: string | null;
  onAct: (order: ItemRequest, path: "cancel" | "receive", success: string, confirmText: string) => void;
  onReviewed: () => void;
}) {
  const listing = order.listing;
  const isPickup = order.fulfillment_method === "pickup";
  const hub = order.pickup_location;
  const recipient = order.recipient;
  const closed = order.status === "cancelled" || order.status === "declined" || order.status === "pending";
  const deliveryFee = !isPickup && typeof order.totals.delivery === "number" ? order.totals.delivery : null;
  const totalLabel = isPickup ? "₦0" : deliveryFee !== null ? formatNaira(deliveryFee) : "₦0 + delivery";

  return (
    <article id={`order-${order.id}`} className={cn("scroll-mt-32 overflow-hidden rounded-2xl border bg-card shadow-soft", highlighted ? "border-primary ring-2 ring-primary/20" : "border-border")}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5 text-xs">
        <span className="font-bold">Order {order.order_number}</span>
        <span className="text-muted-foreground">Placed {timeAgo(order.claimed_at ?? order.created_at)}</span>
      </header>

      <div className="flex gap-4 p-4">
        <Link href={listing ? listingPath(listing.slug) : "/explore"} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-24">
          {listing?.images?.[0] ? <Image src={listing.images[0].url} alt="" fill sizes="96px" className="object-cover" /> : <Package className="absolute inset-0 m-auto size-7 text-primary-300" />}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={order.status} />
            {order.fulfillment_stage_label && order.status === "accepted" && <span className="text-xs font-semibold text-primary">{order.fulfillment_stage_label}</span>}
          </div>
          <Link href={listing ? listingPath(listing.slug) : "/explore"} className="mt-1 line-clamp-2 font-semibold hover:text-primary">{listing?.title ?? "Item"}</Link>
          <p className="mt-0.5 text-sm text-muted-foreground">Given by {listing?.giver?.name ?? "a member"} · Total <strong className="text-foreground">{totalLabel}</strong>{!isPickup && <span className="text-xs"> (item ₦0, delivery paid by you)</span>}</p>
        </div>
      </div>

      {!closed && (
        <div className="border-t border-border px-4 py-4">
          <OrderTimeline steps={order.timeline} />
          {order.stage_note && order.status === "accepted" && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground"><strong className="text-foreground">Update from Gratis Castle:</strong> {order.stage_note}</p>}
        </div>
      )}

      {!closed && (
        <div className="grid gap-3 border-t border-border p-4 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">{isPickup ? <MapPin className="size-4" /> : <Truck className="size-4" />}</span>
            <div className="min-w-0">
              <p className="font-semibold">{isPickup ? "Collect free at our hub" : "Delivery to you"}</p>
              {isPickup && hub ? (
                <>
                  <p className="text-muted-foreground">{hub.name} — {hub.address}, {hub.area}</p>
                  {hub.opening_hours && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {hub.opening_hours}</p>}
                  {hub.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="size-3" /> {hub.phone}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">Bring a valid ID when you collect.</p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  {[recipient?.delivery_address, recipient?.delivery_city, order.state?.name].filter(Boolean).join(", ")}
                  {recipient?.delivery_landmark ? ` (near ${recipient.delivery_landmark})` : ""}
                </p>
              )}
              {!isPickup && (
                <div className="mt-2 rounded-xl border border-brand-yellow-300 bg-highlight-soft px-3 py-2 text-xs text-highlight-soft-foreground">
                  {deliveryFee !== null ? (
                    <>
                      <p><strong>Delivery fee: {formatNaira(deliveryFee)}</strong> — paid by you.</p>
                      {order.totals.delivery_fee_note && <p className="mt-0.5 opacity-90">{order.totals.delivery_fee_note}</p>}
                      <p className="mt-0.5 opacity-90">Never pay more than this, and never pay for the item itself.</p>
                    </>
                  ) : (
                    <p><strong>Delivery fee: to be confirmed.</strong> You pay the delivery cost — we&apos;ll show the exact amount here and notify you before dispatch.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          {recipient && (
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Phone className="size-4" /></span>
              <div className="min-w-0">
                <p className="font-semibold">{recipient.name ?? "Receiver"}</p>
                <p className="text-muted-foreground">{[recipient.phone, recipient.alt_phone].filter(Boolean).join(" · ")}</p>
                <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
        {order.can_confirm_receipt && (
          <Button size="sm" onClick={() => onAct(order, "receive", "Receipt confirmed — enjoy your item!", "Confirm you have received this item? This completes the order.")} disabled={busy === `${order.id}:receive`}>
            {busy === `${order.id}:receive` ? <Loader2 className="size-4 animate-spin" /> : <PackageCheck className="size-4" />} I&apos;ve received it
          </Button>
        )}
        {order.can_review && <ReviewDialog request={order} onSubmitted={onReviewed} />}
        {order.conversation_id && (
          <Button size="sm" variant="outline" asChild><Link href={`/account/messages?conversationId=${order.conversation_id}`}><MessageCircle className="size-4" /> Messages</Link></Button>
        )}
        {order.can_cancel && (
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onAct(order, "cancel", "Order cancelled", "Cancel this order? The item will be offered to other members again.")} disabled={busy === `${order.id}:cancel`}>
            <X className="size-4" /> Cancel order
          </Button>
        )}
        {order.received_at && <span className="text-xs font-medium text-success">Received {timeAgo(order.received_at)}</span>}
        {order.review && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCircle2 className="size-3.5 text-success" /> Reviewed <Star className="size-3 fill-brand-yellow-400 text-brand-yellow-500" /> {order.review.rating}/5</span>
        )}
        {order.status === "accepted" && <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-success"><ShieldCheck className="size-3.5" /> {isPickup ? NO_HIDDEN_FEE : "Item free · only pay the delivery fee shown here"}</span>}
      </footer>
    </article>
  );
}

function ReviewDialog({ request, onSubmitted }: { request: ItemRequest; onSubmitted: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const trimmed = comment.trim();
  const valid = trimmed.length >= 10 && trimmed.length <= 1000;
  const commentId = `review-comment-${request.id}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      await api.post(`requests/${request.id}/review`, { rating, comment: trimmed });
      toast.success("Thanks — your review helps the community.");
      setOpen(false);
      setComment("");
      setRating(5);
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not share your review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="highlight" onClick={() => setOpen(true)}>
        <Star className="size-4" /> Leave a review
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How was it?</DialogTitle>
            <DialogDescription>
              Share your experience with “{request.listing?.title ?? "this item"}”. Only your name, rating and comment appear publicly — never your address or contact details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Your rating</legend>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={rating === value}
                    className={cn(
                      "rounded-lg p-1.5 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      value <= rating ? "text-brand-yellow-500" : "text-muted-foreground/40",
                    )}
                  >
                    <Star className={cn("size-7", value <= rating && "fill-brand-yellow-400")} aria-hidden="true" />
                  </button>
                ))}
                <span className="ml-2 text-sm font-bold tabular-nums">{rating}/5</span>
              </div>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor={commentId}>Your experience</Label>
              <Textarea
                id={commentId}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={5}
                minLength={10}
                maxLength={1000}
                placeholder="What went well? Was the item as described?"
                required
              />
              <p className={cn("text-xs", trimmed.length > 0 && trimmed.length < 10 ? "text-destructive" : "text-muted-foreground")}>
                {trimmed.length}/1000 · at least 10 characters
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Not now</Button>
              <Button type="submit" disabled={!valid || saving}>{saving ? "Sharing…" : "Share review"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
