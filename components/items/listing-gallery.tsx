"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Package } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Badge } from "@/components/ui/badge";
import { photoUrl } from "@/lib/gapcastle";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

type GalleryImage = NonNullable<Listing["images"]>[number];

/**
 * Listing photos. Phones: an edge-to-edge swipeable carousel with dots, like a
 * native app. Desktop: main photo with a thumbnail rail. Tapping any photo opens
 * a full-screen lightbox with pinch / wheel / double-tap zoom and swipe.
 */
export function ListingGallery({
  images,
  title,
  statusLabel,
}: {
  images: GalleryImage[];
  title: string;
  statusLabel: string | null;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = images.map((image, index) => ({ src: photoUrl(image.url) ?? "", alt: `${title} — photo ${index + 1}` }));
  const hasMany = images.length > 1;

  function openAt(index: number) {
    setActive(index);
    setLightboxOpen(true);
  }

  function goTo(index: number) {
    const next = (index + images.length) % images.length;
    setActive(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  }

  if (!images.length) {
    return (
      <div className="relative -mx-4 aspect-square overflow-hidden bg-gradient-to-br from-primary-50 to-brand-yellow-50 sm:mx-0 sm:aspect-[4/3] sm:rounded-3xl">
        <div className="flex size-full flex-col items-center justify-center gap-2 text-primary-300">
          <Package className="size-16" strokeWidth={1.25} />
          <span className="text-sm font-medium text-muted-foreground">No photos yet</span>
        </div>
        <StatusBadges statusLabel={statusLabel} />
      </div>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-3">
      {hasMany && (
        <div className="scrollbar-none hidden max-h-[560px] flex-col gap-2.5 overflow-y-auto lg:flex">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => goTo(index)}
              onMouseEnter={() => goTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === active}
              className={cn(
                "aspect-square shrink-0 overflow-hidden rounded-xl bg-muted ring-2 ring-offset-2 ring-offset-background transition",
                index === active ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- listing thumbnail */}
              <img src={photoUrl(image.url) ?? ""} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className={cn("group relative -mx-4 overflow-hidden bg-muted sm:mx-0 sm:rounded-3xl", !hasMany && "lg:col-span-2")}>
        <div
          ref={trackRef}
          onScroll={(event) => {
            const track = event.currentTarget;
            const index = Math.round(track.scrollLeft / track.clientWidth);
            if (index !== active) setActive(index);
          }}
          className="scrollbar-none flex aspect-square snap-x snap-mandatory overflow-x-auto sm:aspect-[4/3]"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openAt(index)}
              className="relative size-full shrink-0 snap-center cursor-zoom-in"
              aria-label={`Open photo ${index + 1} of ${images.length} full screen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- listing photos are served by the API host */}
              <img
                src={photoUrl(image.url) ?? ""}
                alt={`${title} — photo ${index + 1}`}
                className="size-full object-cover"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                draggable={false}
              />
            </button>
          ))}
        </div>

        <StatusBadges statusLabel={statusLabel} />

        <button
          type="button"
          onClick={() => openAt(active)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary-950/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-primary-950/85"
        >
          <Expand className="size-3.5" /> {hasMany ? `${active + 1} / ${images.length}` : "Zoom"}
        </button>

        {hasMany && (
          <>
            <button type="button" onClick={() => goTo(active - 1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-soft opacity-0 transition-opacity hover:bg-card group-hover:opacity-100 sm:flex">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => goTo(active + 1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 shadow-soft opacity-0 transition-opacity hover:bg-card group-hover:opacity-100 sm:flex">
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 lg:hidden" aria-hidden="true">
              {images.map((image, index) => (
                <span key={image.id} className={cn("h-1.5 rounded-full bg-white/70 shadow transition-all", index === active ? "w-5 bg-white" : "w-1.5")} />
              ))}
            </div>
          </>
        )}
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={active}
        slides={slides}
        plugins={[Zoom, Counter, ...(hasMany ? [Thumbnails] : [])]}
        on={{ view: ({ index }) => goTo(index) }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true, doubleTapDelay: 300 }}
        thumbnails={{ width: 72, height: 72, border: 0, borderRadius: 10, padding: 0, gap: 10, imageFit: "cover" }}
        carousel={{ finite: !hasMany }}
        controller={{ closeOnBackdropClick: true, closeOnPullDown: true }}
        render={hasMany ? undefined : { buttonPrev: () => null, buttonNext: () => null }}
        styles={{ container: { backgroundColor: "rgba(1, 13, 37, 0.96)" }, thumbnailsContainer: { backgroundColor: "rgba(1, 13, 37, 0.96)" } }}
      />
    </div>
  );
}

function StatusBadges({ statusLabel }: { statusLabel: string | null }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5 sm:left-4 sm:top-4">
      <Badge variant="free" className="text-sm shadow-soft">FREE</Badge>
      {statusLabel && <Badge variant="warning" className="shadow-soft">{statusLabel}</Badge>}
    </div>
  );
}
