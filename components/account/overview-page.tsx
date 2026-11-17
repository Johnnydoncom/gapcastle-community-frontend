"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bookmark, Gift, HandHeart, Inbox, MessageCircle, Package, Recycle } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/account/status-badges";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { toListingRow } from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import type { ItemRequest, Listing, Paginated } from "@/lib/types";

// Based on gapcastle-lovable/src/routes/dashboard.tsx.
export function AccountOverviewPage() {
  const { user, session } = useSession();
  const listings = useQuery({ queryKey: ["my-listings"], queryFn: async () => (await api.get<{ data: Listing[] }>("me/listings")).data });
  const requests = useQuery({ queryKey: ["my-requests"], queryFn: async () => (await api.get<{ data: ItemRequest[] }>("me/requests")).data });
  const saved = useQuery({ queryKey: ["saved"], queryFn: async () => (await api.get<Paginated<Listing>>("saved")).data });

  const myListings = listings.data ?? [];
  const requestRows = requests.data ?? [];
  const savedRows = (saved.data ?? []).map(toListingRow);
  const fullName = user?.name.split(" ")[0] ?? "there";

  const stats = [
    { label: "Active listings", count: myListings.filter((l) => l.status === "available").length, icon: Package, href: "/account/listings" },
    { label: "Requests waiting for you", count: myListings.reduce((sum, l) => sum + (l.pending_request_count ?? 0), 0), icon: Inbox, href: "/account/listings" },
    { label: "Requests you've made", count: requestRows.length, icon: HandHeart, href: "/account/requests" },
    { label: "Items rehomed", count: myListings.filter((l) => l.status === "given_away").length, icon: Recycle, href: "/account/listings" },
    { label: "Unread chats", count: session?.unreadConversations ?? 0, icon: MessageCircle, href: "/account/messages" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div><p className="text-sm font-semibold text-primary">Your Gratis Castle</p><h1 className="mt-1 text-3xl font-bold">Good to see you, {fullName}</h1><p className="mt-2 text-muted-foreground">Keep track of the good things moving through your community.</p></div>
        <Button asChild><Link href="/give"><Gift className="size-4" /> Share an item</Link></Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {stats.map(({ label, count, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
            <Icon className="size-4 text-primary" />
            <p className="mt-2 text-2xl font-bold">{listings.isLoading ? "–" : count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10" aria-labelledby="shared-title">
        <div className="flex items-center justify-between gap-3"><div><h2 id="shared-title" className="text-xl font-bold">Items you’ve shared</h2><p className="mt-1 text-sm text-muted-foreground">Your listings and their current status.</p></div><Button variant="ghost" asChild><Link href="/account/listings">Manage <ArrowRight className="size-4" /></Link></Button></div>
        {listings.isLoading ? <div className="mt-5 h-48 animate-pulse rounded-2xl bg-muted" /> : myListings.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{myListings.slice(0, 4).map((listing) => <ItemCard key={listing.id} listing={toListingRow(listing)} />)}</div> : <div className="mt-5 border-y border-border py-7"><p className="font-semibold">Nothing listed yet</p><p className="mt-1 text-sm text-muted-foreground">A good item can make someone’s day.</p><Button asChild variant="outline" className="mt-4"><Link href="/give">Give your first item</Link></Button></div>}
      </section>

      <section className="mt-10" aria-labelledby="requests-title">
        <div className="flex items-center justify-between gap-3"><div><h2 id="requests-title" className="text-xl font-bold">Your requests</h2><p className="mt-1 text-sm text-muted-foreground">Follow the items you’ve asked to receive.</p></div><Button variant="ghost" asChild><Link href="/account/requests">All requests <ArrowRight className="size-4" /></Link></Button></div>
        {requestRows.length ? <div className="mt-4 divide-y divide-border border-y border-border">{requestRows.slice(0, 5).map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><Link href={request.listing ? listingPath(request.listing.slug) : "/explore"} className="font-semibold hover:text-primary">{request.listing?.title ?? "Item request"}</Link><p className="mt-1 text-sm capitalize text-muted-foreground">{request.listing?.location ?? ""} · {request.fulfillment_method}</p></div><RequestStatusBadge status={request.status} /></div>)}</div> : <div className="mt-4 border-y border-border py-6 text-sm text-muted-foreground">No requests yet. <Link href="/explore" className="font-semibold text-primary">Find something useful</Link></div>}
      </section>

      <section className="mt-10" aria-labelledby="saved-title">
        <div className="flex items-center justify-between gap-3"><div><h2 id="saved-title" className="text-xl font-bold">Saved for later</h2><p className="mt-1 text-sm text-muted-foreground">Good finds you’d like to remember.</p></div><Button variant="ghost" asChild><Link href="/account/saved">All saved <ArrowRight className="size-4" /></Link></Button></div>
        {savedRows.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{savedRows.slice(0, 4).map((listing) => <ItemCard key={listing.id} listing={listing} saved />)}</div> : <div className="mt-4 flex items-center gap-3 border-y border-border py-6 text-sm text-muted-foreground"><Bookmark className="size-5 shrink-0 text-primary" />Saved items will show up here.</div>}
      </section>
    </div>
  );
}
