import {
  Smartphone,
  Armchair,
  Shirt,
  CookingPot,
  Lamp,
  Wrench,
  BookOpen,
  Baby,
  Dumbbell,
  GraduationCap,
  Plug,
  Stethoscope,
  Package,
  Laptop,
  Tv,
  Utensils,
  Bike,
  Car,
  Gamepad2,
  Music,
  Flower2,
  PawPrint,
  Briefcase,
  Palette,
  type LucideIcon,
} from "lucide-react";
import type { Category, Listing } from "./types";

/*
 * Copied from gapcastle-lovable/src/lib/gapcastle.ts.
 * Only addition: `toListingRow`, which maps the Laravel API response into the exact
 * ListingRow shape the Lovable screens use, so those screens can stay unchanged.
 */

/** Map a stored photo to a URL. The Laravel API already returns absolute URLs. */
export function photoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url;
}

export const CONDITION_LABELS: Record<string, string> = {
  brand_new: "Brand new",
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  needs_repair: "Needs repair",
};

export const LISTING_STATUS_LABELS: Record<string, string> = {
  available: "Available",
  reserved: "Given away",
  given_away: "Given away",
  removed: "Removed",
  paused: "Paused",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "In progress",
  declined: "Closed",
  cancelled: "Cancelled",
  completed: "Received",
};

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.round(days / 30);
  return `${months}mo ago`;
}

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone,
  armchair: Armchair,
  shirt: Shirt,
  "cooking-pot": CookingPot,
  lamp: Lamp,
  wrench: Wrench,
  "book-open": BookOpen,
  baby: Baby,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  plug: Plug,
  stethoscope: Stethoscope,
  laptop: Laptop,
  tv: Tv,
  utensils: Utensils,
  bike: Bike,
  car: Car,
  "gamepad-2": Gamepad2,
  music: Music,
  "flower-2": Flower2,
  "paw-print": PawPrint,
  briefcase: Briefcase,
  palette: Palette,
  package: Package,
};

export function categoryIcon(icon: string | null | undefined): LucideIcon {
  return (icon && CATEGORY_ICONS[icon]) || Package;
}

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  sort_order: number;
};

export type ListingImageRow = {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
};

export type ListingRow = {
  id: string;
  slug: string;
  giver_id: string;
  giver_slug: string;
  category_id: string | null;
  title: string;
  description: string;
  condition: string;
  location: string;
  pickup_available: boolean;
  pickup_area: string | null;
  pickup_times: string | null;
  pickup_instructions: string | null;
  delivery_available: boolean;
  delivery_notes: string | null;
  fulfillment_notes: string | null;
  status: string;
  moderation_status: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string; icon: string } | null;
  listing_images?: ListingImageRow[];
  profiles?: {
    id: string;
    slug: string;
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
    created_at: string;
  } | null;
  request_count?: number;
  /** Extra fields provided by the Laravel API for the signed-in viewer. */
  is_saved?: boolean;
  is_owner?: boolean;
  viewer_request?: Listing["viewer_request"];
  /** Approximate distance from the visitor, in km ("near me"). */
  distance_km?: number;
};

export function toCategoryRow(category: Category, index = 0): CategoryRow {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description_text ?? category.description,
    icon: category.icon,
    sort_order: index,
  };
}

export function toListingRow(listing: Listing): ListingRow {
  const id = String(listing.id);
  const slug = listing.slug || id;
  const giverId = String(listing.giver?.id ?? "");
  const giverSlug = listing.giver?.slug || giverId;
  return {
    id,
    slug,
    giver_id: giverId,
    giver_slug: giverSlug,
    category_id: listing.category ? String(listing.category.id) : null,
    title: listing.title,
    description: listing.description,
    condition: listing.condition,
    location: [listing.location, listing.city].filter(Boolean).join(", "),
    pickup_available: listing.pickup.available,
    pickup_area: listing.pickup.area,
    pickup_times: listing.pickup.times,
    pickup_instructions: listing.pickup.instructions,
    delivery_available: listing.delivery.available,
    delivery_notes: listing.delivery.notes,
    fulfillment_notes: listing.fulfillment_notes,
    status: listing.status,
    moderation_status: listing.moderation_status ?? "approved",
    is_demo: listing.is_demo,
    created_at: listing.created_at,
    updated_at: listing.created_at,
    categories: listing.category ? { name: listing.category.name, slug: listing.category.slug, icon: listing.category.icon } : null,
    listing_images: (listing.images ?? []).map((image, index) => ({ id: String(image.id), listing_id: id, url: image.url, sort_order: index })),
    profiles: listing.giver
      ? {
          id: giverId,
          slug: giverSlug,
          full_name: listing.giver.name,
          avatar_url: listing.giver.avatar_url,
          location: listing.giver.location,
          bio: listing.giver.bio,
          created_at: listing.giver.member_since ?? listing.created_at,
        }
      : null,
    request_count: listing.request_count,
    distance_km: listing.distance_km,
    is_saved: listing.is_saved,
    is_owner: listing.is_owner,
    viewer_request: listing.viewer_request,
  };
}
