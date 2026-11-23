"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Heart, PackageCheck, Pencil, Receipt, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/report-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { NO_HIDDEN_FEE } from "@/lib/content";
import { listingPath } from "@/lib/site";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  listingId: number;
  listingSlug: string;
  title: string;
  status: Listing["status"];
  isRequestable: boolean;
  isOwner: boolean;
  isSaved: boolean;
  viewerRequest: Listing["viewer_request"] | null;
};

/**
 * Interactive actions for a single listing: the desktop buy-box buttons and, on
 * phones, a native-style sticky action bar. Getting an item happens on its own
 * free checkout page (/items/[slug]/request), never in a popup. The first member
 * to check out gets the item; after that it shows as given away.
 */
export function ItemActions({ listingId, listingSlug, title, status, isRequestable, isOwner, isSaved, viewerRequest }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const [saved, setSaved] = useState(isSaved);

  const myOrder = viewerRequest && ["accepted", "completed"].includes(viewerRequest.status) ? viewerRequest : null;
  const itemPath = listingPath(listingSlug);
  const checkoutPath = `${itemPath}/request`;
  const canCheckout = !isOwner && isRequestable && !myOrder;
  const isGone = status === "reserved" || status === "given_away";

  async function toggleSave() {
    if (!userId) {
      toast.info("Sign in to save items");
      router.push(`/auth?next=${encodeURIComponent(itemPath)}`);
      return;
    }

    const next = !saved;
    setSaved(next);
    try {
      if (next) {
        await api.post(`listings/${listingId}/save`);
        toast.success("Saved to your list");
      } else {
        await api.delete(`listings/${listingId}/save`);
      }
    } catch {
      setSaved(!next);
      toast.error("Could not update saved items");
    }
  }

  async function share() {
    const url = `${window.location.origin}${itemPath}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Free on Gratis Castle: ${title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // The share sheet was dismissed.
    }
  }

  const primary = canCheckout ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={userId ? checkoutPath : `/auth?next=${encodeURIComponent(checkoutPath)}`}>
        Get it free <ArrowRight className="size-4" />
      </Link>
    </Button>
  ) : isOwner ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={`/account/listings?listing=${listingId}`}><Pencil className="size-4" /> Manage listing</Link>
    </Button>
  ) : myOrder ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={`/account/requests?order=${myOrder.id}`}><Receipt className="size-4" /> View my order</Link>
    </Button>
  ) : (
    <Button size="lg" className="h-12 flex-1 rounded-xl text-base" disabled>
      {isGone ? <><PackageCheck className="size-4" /> Given away</> : "Not available"}
    </Button>
  );

  return (
    <>
      {myOrder && (
        <div className="mt-5 rounded-2xl border border-success/30 bg-success-soft/50 p-4 text-sm">
          <p className="font-bold text-success">{myOrder.status === "completed" ? "This item is yours. Enjoy!" : "You got this item — it's on its way to you."}</p>
          <p className="mt-1 text-muted-foreground">Track every step and confirm when you receive it in your orders.</p>
        </div>
      )}

      {isGone && !myOrder && !isOwner && (
        <div className="mt-5 rounded-2xl border border-border bg-muted/60 p-4 text-sm">
          <p className="font-bold">This item has been given away</p>
          <p className="mt-1 text-muted-foreground">Someone checked it out first. There are plenty more free items to discover.</p>
          <Button asChild size="sm" variant="outline" className="mt-3"><Link href="/explore">Explore free items</Link></Button>
        </div>
      )}

      {/* Desktop / tablet buy box */}
      <div className="mt-5 hidden gap-2.5 sm:flex">
        {primary}
        <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save item"}>
          <Heart className={cn("size-5", saved && "fill-destructive text-destructive")} />
        </Button>
        <Button size="lg" variant="outline" className="h-12 rounded-xl" onClick={share} aria-label="Share">
          <Share2 className="size-5" />
        </Button>
      </div>
      {canCheckout && (
        <p className="mt-2.5 hidden items-center gap-1.5 text-sm font-semibold text-success sm:flex">
          <ShieldCheck className="size-4" /> {NO_HIDDEN_FEE} <span className="font-normal text-muted-foreground">Item ₦0 · Delivery ₦0</span>
        </p>
      )}

      {/* Phone: native-style sticky action bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur sm:hidden">
        {canCheckout && (
          <p className="flex items-center justify-center gap-1.5 border-b border-border/60 py-1 text-[11px] font-semibold text-success">
            <ShieldCheck className="size-3.5" /> {NO_HIDDEN_FEE}
          </p>
        )}
        <div className="flex items-center gap-2 px-4 py-2.5">
          <button type="button" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save item"} className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-muted-foreground transition active:scale-90">
            <Heart className={cn("size-5", saved && "fill-destructive text-destructive")} /> {saved ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={share} aria-label="Share" className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl text-[10px] font-semibold text-muted-foreground transition active:scale-90">
            <Share2 className="size-5" /> Share
          </button>
          {primary}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          Never pay anyone for a free item or its delivery.{" "}
          <Link href="/safety" className="font-semibold text-primary hover:underline">Safety tips</Link>
        </p>
        {userId && !isOwner && <ReportDialog type="listing" id={listingId} label="Report listing" />}
      </div>
    </>
  );
}
