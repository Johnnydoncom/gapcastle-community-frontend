import Link from "next/link";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { MEETUP_SAFETY_TIPS, MEETUP_WARNING } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Strict warning against private meetups, with basic personal-safety tips for
 * members who go ahead anyway. Used on waybill checkout, chat and the hubs page.
 * Works in server and client components (native <details>, no state).
 */
export function MeetupSafetyWarning({ defaultOpen = false, className }: { defaultOpen?: boolean; className?: string }) {
  return (
    <aside role="note" aria-label="Meetup safety warning" className={cn("rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 text-sm", className)}>
      <p className="flex items-center gap-2 font-extrabold text-destructive">
        <ShieldAlert className="size-5 shrink-0" /> Never meet in person — stay security conscious
      </p>
      <p className="mt-1.5 leading-relaxed text-foreground/85">{MEETUP_WARNING}</p>
      <details open={defaultOpen} className="group mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-destructive [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show safety tips</span>
          <span className="hidden group-open:inline">Hide safety tips</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed text-foreground/85 marker:text-destructive">
          {MEETUP_SAFETY_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
        <Link href="/safety" className="mt-2 inline-block font-semibold text-primary hover:underline">Read our full safety guidelines</Link>
      </details>
    </aside>
  );
}
