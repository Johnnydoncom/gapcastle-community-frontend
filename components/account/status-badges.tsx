import { Badge } from "@/components/ui/badge";
import { LISTING_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/lib/gapcastle";

const REQUEST_VARIANTS: Record<string, "secondary" | "success" | "muted" | "destructive" | "warning" | "default"> = {
  pending: "muted",
  accepted: "warning",
  declined: "muted",
  cancelled: "muted",
  completed: "success",
};

const LISTING_VARIANTS: Record<string, "secondary" | "success" | "muted" | "destructive" | "warning" | "default"> = {
  available: "success",
  reserved: "warning",
  given_away: "default",
  paused: "muted",
  removed: "destructive",
};

export function RequestStatusBadge({ status }: { status: string }) {
  return <Badge variant={REQUEST_VARIANTS[status] ?? "secondary"}>{REQUEST_STATUS_LABELS[status] ?? status}</Badge>;
}

/** `owner` shows the giver's view: a checked-out item is "Claimed" until the receiver confirms it arrived. */
export function ListingStatusBadge({ status, moderation, owner = false }: { status: string; moderation?: string; owner?: boolean }) {
  if (moderation === "pending") return <Badge variant="warning">Awaiting review</Badge>;
  if (moderation === "rejected") return <Badge variant="destructive">Not approved</Badge>;
  if (owner && status === "reserved") return <Badge variant="warning">Claimed — handover in progress</Badge>;
  return <Badge variant={LISTING_VARIANTS[status] ?? "secondary"}>{LISTING_STATUS_LABELS[status] ?? status}</Badge>;
}
