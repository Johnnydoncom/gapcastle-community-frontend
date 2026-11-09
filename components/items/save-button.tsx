"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { listingPath } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  listingSlug: string;
  saved?: boolean;
  onSavedChange?: (listingId: string, saved: boolean) => void;
  className?: string;
  /** Hero button styling for a single item page. */
  variant?: "icon" | "button";
};

/** The only interactive part of an item card, kept as a small client island. */
export function SaveButton({ listingId, listingSlug, saved = false, onSavedChange, className, variant = "icon" }: Props) {
  const { userId } = useAuth();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(saved);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      toast.info("Sign in to save items to your list");
      router.push(`/auth?next=${encodeURIComponent(listingPath(listingSlug))}`);
      return;
    }

    const next = !isSaved;
    setIsSaved(next);

    try {
      if (next) {
        await api.post(`listings/${listingId}/save`);
        toast.success("Saved to your list");
      } else {
        await api.delete(`listings/${listingId}/save`);
      }
      onSavedChange?.(listingId, next);
      router.refresh();
    } catch {
      setIsSaved(!next);
      toast.error("Could not update saved items");
    }
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isSaved}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-6 text-sm font-semibold shadow-soft transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Heart className={cn("size-4", isSaved ? "fill-destructive text-destructive" : "")} />
        {isSaved ? "Saved" : "Save item"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isSaved ? "Remove from saved" : "Save item"}
      aria-pressed={isSaved}
      onClick={toggle}
      className={cn(
        "absolute right-3 top-3 rounded-full bg-card/90 p-2 shadow-soft transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <Heart className={cn("size-4", isSaved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
    </button>
  );
}
