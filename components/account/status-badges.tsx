import { Badge } from "@/components/ui/badge";
import { LISTING_STATUS_LABELS, REQUEST_STATUS_LABELS } from "@/lib/gapcastle";

const REQUEST_VARIANTS: Record<string, "secondary" | "success" | "muted" | "destructive" | "warning" | "default"> = {
  pending: "warning",
  accepted: "success",
  declined: "muted",
  cancelled: "muted",
  completed: "default",
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

export function ListingStatusBadge({ status, moderation }: { status: string; moderation?: string }) {
  if (moderation === "pending") return <Badge variant="warning">Awaiting review</Badge>;
  if (moderation === "rejected") return <Badge variant="destructive">Not approved</Badge>;
  return <Badge variant={LISTING_VARIANTS[status] ?? "secondary"}>{LISTING_STATUS_LABELS[status] ?? status}</Badge>;
}
