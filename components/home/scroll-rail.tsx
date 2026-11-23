"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A horizontal, swipeable rail. The items (`<li>` children) are rendered on the
 * server, so their content and links are in the initial HTML for SEO; this client
 * shell only adds the arrows and an optional gentle auto-advance
 * that pauses on hover/touch/focus and never runs for reduced-motion users.
 */
export function ScrollRail({
  children,
  label,
  autoplay = false,
  interval = 3800,
  className,
  trackClassName,
}: {
  children: ReactNode;
  label: string;
  autoplay?: boolean;
  interval?: number;
  className?: string;
  trackClassName?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState({ start: true, end: false, overflow: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setState({
      start: track.scrollLeft < 8,
      end: track.scrollLeft > max - 8,
      overflow: max > 8,
    });
  }, []);

  const step = useCallback((direction: 1 | -1, loop = false) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.querySelector<HTMLElement>(":scope > li");
    const gap = parseFloat(getComputedStyle(track).columnGap || "16") || 16;
    const distance = item ? (item.offsetWidth + gap) * (window.innerWidth >= 1024 ? 2 : 1) : track.clientWidth * 0.8;
    const max = track.scrollWidth - track.clientWidth;
    if (loop && direction === 1 && track.scrollLeft > max - 8) track.scrollTo({ left: 0, behavior: "smooth" });
    else track.scrollBy({ left: direction * distance, behavior: "smooth" });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    if (!autoplay || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") step(1, true);
    }, interval);
    return () => window.clearInterval(timer);
  }, [autoplay, paused, interval, step]);

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <ul
        ref={trackRef}
        onScroll={measure}
        aria-label={label}
        className={cn(
          "scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 py-1 sm:mx-0 sm:gap-4 sm:scroll-px-0 sm:px-0",
          trackClassName,
        )}
      >
        {children}
      </ul>

      {state.overflow && (
        <>
          <RailArrow direction="left" hidden={state.start} onClick={() => step(-1)} />
          <RailArrow direction="right" hidden={state.end} onClick={() => step(1)} />
        </>
      )}
    </div>
  );
}

function RailArrow({ direction, hidden, onClick }: { direction: "left" | "right"; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll back" : "Scroll for more"}
      className={cn(
        "absolute top-[calc(50%-0.75rem)] z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-lift backdrop-blur transition-[opacity,color] hover:text-primary sm:flex",
        direction === "left" ? "-left-5" : "-right-5",
        hidden && "pointer-events-none opacity-0",
      )}
    >
      {direction === "left" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}
