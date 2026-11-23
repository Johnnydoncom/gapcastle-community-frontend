"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Bookmark, CheckCircle2, ChevronRight, Gift, MapPin, MessageCircle, Package, PackageCheck, PackageSearch, Receipt, Recycle, Star, Truck, type LucideIcon } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { RequestStatusBadge } from "@/components/account/status-badges";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { toListingRow } from "@/lib/gapcastle";
import type { ItemRequest, Listing, Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

type Action = { key: string; icon: LucideIcon; title: string; text: string; href: string; tone: "primary" | "warning" | "success" };

/**
 * The member dashboard: what needs doing now (confirm receipt, collect, hand over,
 * fix a listing, review), headline numbers, and recent orders and listings.
 */
export function AccountOverviewPage() {
  const { user, session } = useSession();
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: async () => (await api.get<{ data: Listing[] }>("me/listings")).data });
  const orders = useQuery({ queryKey: ["my-requests"], queryFn: async () => (await api.get<{ data: ItemRequest[] }>("me/requests")).data });
  const saved = useQuery({ queryKey: ["saved"], queryFn: async () => (await api.get<Paginated<Listing>>("saved")).data });

  const myListings = listings.data ?? [];
  const myOrders = orders.data ?? [];
  const savedRows = (saved.data ?? []).map(toListingRow);
  const firstName = user?.first_name ?? user?.name.split(" ")[0] ?? "there";
  const loading = listings.isLoading || orders.isLoading;

  const actions: Action[] = [
    ...myOrders.filter((order) => order.can_confirm_receipt).map((order): Action => ({
      key: `receive-${order.id}`, icon: PackageCheck, tone: "success",
      title: `Confirm you received “${order.listing?.title ?? "your item"}”`,
      text: order.fulfillment_stage === "ready_for_pickup" ? `Waiting for you at ${order.pickup_location?.name ?? "the hub"} — confirm once you've collected it.` : "Tap “I've received it” once it's in your hands.",
      href: `/account/requests?order=${order.id}`,
    })),
    ...myListings.filter((listing) => listing.status === "reserved").map((listing): Action => ({
      key: `handover-${listing.id}`, icon: listing.handover_method === "dispatch_pickup" ? Truck : MapPin, tone: "primary",
      title: `Hand over “${listing.title}”`,
      text: listing.handover_method === "dispatch_pickup" ? "Someone got your item. Our dispatch rider will call you to collect it." : "Someone got your item. Please drop it at the Gratis Castle hub.",
      href: `/account/listings?listing=${listing.id}`,
    })),
    ...myListings.filter((listing) => listing.moderation_status === "rejected").map((listing): Action => ({
      key: `fix-${listing.id}`, icon: AlertTriangle, tone: "warning",
      title: `Update “${listing.title}”`,
      text: "This listing wasn't approved. Edit it and it goes back for review.",
      href: `/account/listings/${listing.id}/edit`,
    })),
    ...myOrders.filter((order) => order.can_review).map((order): Action => ({
      key: `review-${order.id}`, icon: Star, tone: "warning",
      title: `Thank the giver of “${order.listing?.title ?? "your item"}”`,
      text: "Leave a short review — it means a lot to the community.",
      href: `/account/requests?order=${order.id}`,
    })),
  ];

  const stats = [
    { label: "Orders in progress", value: myOrders.filter((o) => o.status === "accepted").length, icon: Receipt, href: "/account/requests" },
    { label: "Items received", value: myOrders.filter((o) => o.status === "completed").length, icon: PackageCheck, href: "/account/requests" },
    { label: "Active listings", value: myListings.filter((l) => l.status === "available" && l.moderation_status === "approved").length, icon: Package, href: "/account/listings" },
    { label: "Items given away", value: myListings.filter((l) => l.status === "given_away" || l.status === "reserved").length, icon: Recycle, href: "/account/listings" },
    { label: "Unread chats", value: session?.unreadConversations ?? 0, icon: MessageCircle, href: "/account/messages" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm font-semibold text-primary">Your dashboard</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">Good to see you, {firstName}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            You&apos;ve got <strong className="text-foreground">{Math.max(0, (user?.claims?.monthly_limit ?? 3) - (user?.claims?.this_month ?? 0))}</strong> of {user?.claims?.monthly_limit ?? 3} free items left this month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/explore"><PackageSearch className="size-4" /> Find items</Link></Button>
          <Button asChild><Link href="/give"><Gift className="size-4" /> Give an item</Link></Button>
        </div>
      </div>

      <section className="mt-6" aria-labelledby="actions-title">
        <h2 id="actions-title" className="text-lg font-bold">Action needed</h2>
        {loading ? (
          <div className="mt-3 h-20 animate-pulse rounded-2xl bg-muted" />
        ) : actions.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
            <CheckCircle2 className="size-5 shrink-0 text-success" /> You&apos;re all caught up.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {actions.map((action) => (
              <li key={action.key}>
                <Link href={action.href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                  <span className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    action.tone === "success" && "bg-success-soft text-success",
                    action.tone === "primary" && "bg-primary-50 text-primary",
                    action.tone === "warning" && "bg-highlight-soft text-highlight-soft-foreground",
                  )}><action.icon className="size-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-sm font-semibold">{action.title}</span>
                    <span className="line-clamp-2 block text-xs text-muted-foreground">{action.text}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <Icon className="size-4 text-primary" />
            <p className="mt-2 text-2xl font-extrabold">{loading ? "–" : value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="orders-title">
        <SectionHeader id="orders-title" title="Recent orders" text="Items you're getting, and where they are." href="/account/requests" link="All orders" />
        {myOrders.length ? (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {myOrders.slice(0, 4).map((order) => (
              <li key={order.id}>
                <Link href={`/account/requests?order=${order.id}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 sm:p-4">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {order.listing?.images?.[0] ? <Image src={order.listing.images[0].url} alt="" fill sizes="56px" className="object-cover" /> : <Package className="absolute inset-0 m-auto size-5 text-primary-300" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block font-semibold">{order.listing?.title ?? "Item"}</span>
                    <span className="block text-xs text-muted-foreground">{order.order_number} · {order.status === "accepted" ? order.fulfillment_stage_label : order.fulfillment_method === "pickup" ? "Hub pickup" : "Free delivery"}</span>
                  </span>
                  <RequestStatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyRow icon={PackageSearch} text="No orders yet." href="/explore" link="Find something useful" />
        )}
      </section>

      <section className="mt-10" aria-labelledby="shared-title">
        <SectionHeader id="shared-title" title="Items you're giving" text="Your listings and their status." href="/account/listings" link="Manage" />
        {myListings.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{myListings.slice(0, 4).map((listing) => <ItemCard key={listing.id} listing={toListingRow(listing)} />)}</div>
        ) : (
          <EmptyRow icon={Gift} text="Nothing listed yet — a good item can make someone's day." href="/give" link="Give your first item" />
        )}
      </section>

      <section className="mt-10" aria-labelledby="saved-title">
        <SectionHeader id="saved-title" title="Saved for later" text="Good finds you'd like to remember." href="/account/saved" link="All saved" />
        {savedRows.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{savedRows.slice(0, 4).map((listing) => <ItemCard key={listing.id} listing={listing} saved />)}</div>
        ) : (
          <EmptyRow icon={Bookmark} text="Saved items will show up here." href="/explore" link="Browse items" />
        )}
      </section>
    </div>
  );
}

function SectionHeader({ id, title, text, href, link }: { id: string; title: string; text: string; href: string; link: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-lg font-bold sm:text-xl">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
      </div>
      <Button variant="ghost" size="sm" asChild><Link href={href}>{link} <ArrowRight className="size-4" /></Link></Button>
    </div>
  );
}

function EmptyRow({ icon: Icon, text, href, link }: { icon: LucideIcon; text: string; href: string; link: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground">
      <Icon className="size-5 shrink-0 text-primary" />
      <span className="flex-1">{text}</span>
      <Link href={href} className="font-semibold text-primary hover:underline">{link}</Link>
    </div>
  );
}
