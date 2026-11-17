"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Heart, MessageCircle, Pencil, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/report-dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { REQUEST_STATUS_LABELS } from "@/lib/gapcastle";
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
 * phones, a native-style sticky action bar. Requesting happens on its own
 * checkout page (/items/[slug]/request), never in a popup.
 */
export function ItemActions({ listingId, listingSlug, title, status, isRequestable, isOwner, isSaved, viewerRequest }: Props) {
  const router = useRouter();
  const { userId } = useAuth();
  const [saved, setSaved] = useState(isSaved);
  const [cancelling, setCancelling] = useState(false);

  const activeRequest = viewerRequest && viewerRequest.status !== "cancelled" ? viewerRequest : null;
  const itemPath = listingPath(listingSlug);
  const checkoutPath = `${itemPath}/request`;
  const canRequest = !isOwner && isRequestable && !activeRequest;

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

  async function cancelRequest() {
    if (!activeRequest || !confirm("Cancel your request for this item?")) return;

    setCancelling(true);
    try {
      await api.post(`requests/${activeRequest.id}/cancel`);
      toast.success("Request cancelled");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel request");
    } finally {
      setCancelling(false);
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

  const primary = canRequest ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={userId ? checkoutPath : `/auth?next=${encodeURIComponent(checkoutPath)}`}>
        Request this item <ArrowRight className="size-4" />
      </Link>
    </Button>
  ) : isOwner ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={`/account/listings?listing=${listingId}`}><Pencil className="size-4" /> Manage listing</Link>
    </Button>
  ) : activeRequest?.conversation_id ? (
    <Button asChild size="lg" className="h-12 flex-1 rounded-xl text-base">
      <Link href={`/account/messages?conversationId=${activeRequest.conversation_id}`}><MessageCircle className="size-4" /> Open chat</Link>
    </Button>
  ) : (
    <Button size="lg" className="h-12 flex-1 rounded-xl text-base" disabled>
      {activeRequest ? "Requested" : status === "reserved" ? "Reserved" : "Not available"}
    </Button>
  );

  return (
    <>
      {activeRequest && (
        <div className="mt-5 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-sm">
          <p className="font-bold text-primary-800">Your request · {REQUEST_STATUS_LABELS[activeRequest.status]}</p>
          <p className="mt-1 text-primary-900/75">
            {activeRequest.status === "pending" && "The giver has been notified. You'll hear back here and by notification."}
            {activeRequest.status === "accepted" && "Accepted! Gratis Castle will let you know when it's ready at your hub or on its way by waybill."}
            {activeRequest.status === "declined" && "The giver chose someone else this time — there are plenty more good things to discover."}
            {activeRequest.status === "completed" && "This item is yours. Enjoy!"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/account/requests">View my requests</Link></Button>
            {["pending", "accepted"].includes(activeRequest.status) && (
              <Button size="sm" variant="ghost" onClick={cancelRequest} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel request"}
              </Button>
            )}
          </div>
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

      {/* Phone: native-style sticky action bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur sm:hidden">
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
          Never share your home address publicly.{" "}
          <Link href="/safety" className="font-semibold text-primary hover:underline">Safety tips</Link>
        </p>
        {userId && !isOwner && <ReportDialog type="listing" id={listingId} label="Report listing" />}
      </div>
    </>
  );
}
