import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { SAFETY_BANNER } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Reviewer-supplied anti-scam banner: "A gift should never cost your safety." */
export function SafetyStrip({ className }: { className?: string }) {
  return (
    <section className={cn("container-page", className)} aria-labelledby="safety-strip-title">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-brand-yellow-200 bg-highlight-soft px-4 py-3 text-highlight-soft-foreground sm:flex-row sm:items-center sm:gap-4">
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-highlight text-highlight-foreground sm:flex">
          <ShieldAlert className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="safety-strip-title" className="flex items-center gap-1.5 text-sm font-bold"><ShieldAlert className="size-4 sm:hidden" />{SAFETY_BANNER.title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed opacity-85">{SAFETY_BANNER.body}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link href="/contact?topic=safety" className="inline-flex h-8 items-center rounded-lg bg-highlight-soft-foreground px-3 text-xs font-bold text-white transition-opacity hover:opacity-90">
            Report
          </Link>
          <Link href="/safety" className="inline-flex h-8 items-center rounded-lg border border-current/25 px-3 text-xs font-semibold transition-colors hover:bg-white/40">
            Safety tips
          </Link>
        </div>
      </div>
    </section>
  );
}
