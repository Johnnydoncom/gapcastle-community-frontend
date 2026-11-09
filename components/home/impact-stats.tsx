"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, MapPin, Recycle, Users } from "lucide-react";
import type { CommunityStats } from "@/lib/types";

const STATS = [
  { key: "items_shared", label: "Items shared", icon: Gift },
  { key: "items_rehomed", label: "Items rehomed", icon: Recycle },
  { key: "members", label: "Community members", icon: Users },
  { key: "communities", label: "Cities reached", icon: MapPin },
] as const;

/**
 * Animated impact figures. The server passes the real numbers, so the first
 * HTML already contains them; the count-up only runs once scrolled into view.
 */
export function ImpactStats({ stats }: { stats: CommunityStats }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="container-page mt-10" aria-labelledby="impact-title" ref={ref}>
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Community impact</p>
            <h2 id="impact-title" className="mt-0.5 text-xl font-extrabold sm:text-2xl">A little generosity goes a long way</h2>
          </div>
          <p className="text-xs text-muted-foreground">Live figures from real community activity — demo listings are not counted.</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {STATS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="rounded-2xl bg-muted/60 p-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-soft"><Icon className="size-[18px]" /></span>
              <p className="mt-3 text-2xl font-extrabold tabular-nums text-primary-700 sm:text-3xl">
                <CountUp value={stats[key]} run={visible} />
              </p>
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CountUp({ value, run }: { value: number; run: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, run]);

  return <>{new Intl.NumberFormat("en-NG").format(display)}</>;
}
