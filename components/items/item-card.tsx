import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveButton } from "@/components/items/save-button";
import {
  CONDITION_LABELS,
  LISTING_STATUS_LABELS,
  timeAgo,
  type ListingRow,
} from "@/lib/gapcastle";
import { listingPath } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Server-rendered marketplace item card. Only the save button is a client island,
 * so listings are present in the initial HTML for crawlers and fast first paint.
 */
export function ItemCard({
  listing,
  saved,
  onSavedChange,
  className,
}: {
  listing: ListingRow;
  saved?: boolean | undefined;
  onSavedChange?: (listingId: string, saved: boolean) => void;
  className?: string;
}) {
  const image = listing.listing_images?.[0]?.url;
  const status = listing.status;
  const isAvailable = status === "available";

  return (
    <Link
      href={listingPath(listing.slug)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[box-shadow,transform,border-color] duration-200 hover:border-primary-200 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary-50 to-brand-yellow-50 text-primary-300">
            <Package className="size-12" strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {listing.is_demo && <Badge variant="muted" className="bg-card/90 shadow-soft backdrop-blur">Demo</Badge>}
        </div>
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-950/50">
            <Badge variant="outline" className="bg-card/95 text-sm">
              {LISTING_STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
        )}
        <SaveButton
          listingId={listing.id}
          listingSlug={listing.slug}
          saved={saved ?? listing.is_saved ?? false}
          onSavedChange={onSavedChange}
          className="right-2.5 top-2.5"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-highlight px-1.5 py-0.5 text-[11px] font-extrabold tracking-wider text-highlight-foreground">FREE</span>
          <span className="truncate text-[11px] font-medium text-muted-foreground">{CONDITION_LABELS[listing.condition] ?? listing.condition}</span>
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">{listing.title}</h3>
        {listing.categories?.name && <p className="truncate text-xs text-muted-foreground">{listing.categories.name}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{listing.location}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className="size-3" /> {timeAgo(listing.created_at)}
          </span>
        </div>
        {(listing.request_count ?? 0) > 0 && (
          <p className="text-[11px] font-medium text-primary">
            {listing.request_count} request{(listing.request_count ?? 0) === 1 ? "" : "s"}
          </p>
        )}
      </div>
    </Link>
  );
}

export function ItemCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)} aria-hidden="true">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3.5">
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
