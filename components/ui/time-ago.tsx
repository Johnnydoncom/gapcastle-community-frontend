"use client";

import { timeAgo } from "@/lib/gapcastle";

/**
 * Relative time ("3h ago") computed in the browser. Server components can't call
 * Date.now() while prerendering with Cache Components, so they render this instead.
 */
export function TimeAgo({ iso, className }: { iso: string | null | undefined; className?: string }) {
  if (!iso) return null;
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {timeAgo(iso)}
    </time>
  );
}
