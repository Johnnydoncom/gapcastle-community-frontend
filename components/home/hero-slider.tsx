"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  key: string;
  eyebrow: string;
  title: string;
  highlight: string;
  text: string;
  image: string;
  imagePosition?: string;
  tone: "blue" | "navy" | "yellow";
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
};

const TONES = {
  blue: {
    panel: "bg-primary-800 text-white",
    wash: "from-primary-800 from-[34%] via-primary-800/80 via-[52%] to-primary-800/0",
    mobileWash: "from-primary-900 via-primary-900/85 to-primary-900/40",
    eyebrow: "bg-white/10 text-brand-yellow-200 ring-white/15",
    highlight: "text-brand-yellow-300",
    text: "text-primary-50/90",
    primary: "bg-highlight text-highlight-foreground hover:bg-brand-yellow-400",
    secondary: "border-white/30 bg-white/10 text-white hover:bg-white/15",
  },
  navy: {
    panel: "bg-ink text-white",
    wash: "from-ink from-[34%] via-ink/80 via-[52%] to-ink/0",
    mobileWash: "from-ink via-ink/85 to-ink/40",
    eyebrow: "bg-white/10 text-brand-yellow-200 ring-white/15",
    highlight: "text-brand-yellow-300",
    text: "text-white/80",
    primary: "bg-highlight text-highlight-foreground hover:bg-brand-yellow-400",
    secondary: "border-white/30 bg-white/10 text-white hover:bg-white/15",
  },
  yellow: {
    panel: "bg-brand-yellow-100 text-foreground",
    wash: "from-brand-yellow-100 from-[34%] via-brand-yellow-100/85 via-[52%] to-brand-yellow-100/0",
    mobileWash: "from-brand-yellow-100 via-brand-yellow-100/90 to-brand-yellow-100/50",
    eyebrow: "bg-white/70 text-brand-yellow-800 ring-brand-yellow-300",
    highlight: "text-primary",
    text: "text-foreground/75",
    primary: "bg-primary text-primary-foreground hover:bg-primary-700",
    secondary: "border-foreground/15 bg-white/60 text-foreground hover:bg-white",
  },
} as const;

const AUTO_ADVANCE_MS = 6500;

/**
 * Marketplace promo banner. Every slide is rendered on the server (all headings
 * and links are in the HTML); the client only cross-fades between them, with
 * swipe, arrows and a gentle auto-advance that pauses on hover/focus/touch and
 * never runs for reduced-motion users.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((direction: 1 | -1) => setActive((current) => (current + direction + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") go(1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, count, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Gratis Castle highlights"
      className="group/hero relative isolate h-[400px] overflow-hidden sm:h-[380px] sm:rounded-3xl lg:h-full lg:min-h-[400px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { setPaused(true); touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && Math.abs(end - start) > 45) go(end < start ? 1 : -1);
        touchStart.current = null;
      }}
    >
      <div className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style={{ transform: `translateX(-${active * 100}%)` }}>
      {slides.map((slide, index) => {
        const tone = TONES[slide.tone];
        const isActive = index === active;
        return (
          <div
            key={slide.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            aria-hidden={!isActive}
            inert={!isActive}
            className={cn("relative h-full w-full shrink-0 overflow-hidden", tone.panel)}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width: 1280px) 760px, (min-width: 1024px) 70vw, 100vw"
              className={cn("object-cover transition-transform duration-[7000ms] ease-out sm:left-auto! sm:w-[62%]!", isActive && "scale-105")}
              style={{ objectPosition: slide.imagePosition ?? "center" }}
            />
            <div className={cn("absolute inset-0 bg-gradient-to-t sm:hidden", tone.mobileWash)} />
            <div className={cn("absolute inset-0 hidden bg-gradient-to-r sm:block", tone.wash)} />

            <div className="relative flex h-full flex-col justify-end p-6 pb-8 sm:justify-center sm:p-9 lg:p-10">
              <div className="max-w-md">
                <p className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 backdrop-blur", tone.eyebrow)}>{slide.eyebrow}</p>
                {/* Only the first slide's heading is the page h1. */}
                {index === 0 ? (
                  <h1 className="mt-3 text-[30px] font-extrabold leading-[1.08] sm:text-[38px]">
                    {slide.title} <span className={tone.highlight}>{slide.highlight}</span>
                  </h1>
                ) : (
                  <h2 className="mt-3 text-[30px] font-extrabold leading-[1.08] sm:text-[38px]">
                    {slide.title} <span className={tone.highlight}>{slide.highlight}</span>
                  </h2>
                )}
                <p className={cn("mt-3 text-sm leading-relaxed sm:text-[15px]", tone.text)}>{slide.text}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href={slide.primary.href} className={cn("inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors", tone.primary)}>
                    {slide.primary.label} <ArrowRight className="size-4" />
                  </Link>
                  {slide.secondary && (
                    <Link href={slide.secondary.href} className={cn("inline-flex h-11 items-center rounded-xl border px-5 text-sm font-semibold backdrop-blur transition-colors", tone.secondary)}>
                      {slide.secondary.label}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="absolute left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-lift transition-opacity hover:text-primary group-hover/hero:opacity-100 focus-visible:opacity-100 sm:flex">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next slide" className="absolute right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-lift transition-opacity hover:text-primary group-hover/hero:opacity-100 focus-visible:opacity-100 sm:flex">
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </section>
  );
}
