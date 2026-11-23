/** Shapes returned by the Laravel API (`/api/v1`). */

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  available_count?: number;
};

export type PublicProfile = {
  id: number;
  slug: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  member_since: string | null;
  is_demo: boolean;
  trust: {
    email_verified: boolean;
    phone_verified: boolean;
    items_shared?: number;
    active_listings?: number;
  };
};

export type ListingCondition = "brand_new" | "like_new" | "good" | "fair" | "needs_repair";
export type HandoverMethod = "hub_dropoff" | "dispatch_pickup";
export type FulfillmentStage = "awaiting_handover" | "at_hub" | "ready_for_pickup" | "out_for_delivery" | "delivered";
export type ListingStatus = "available" | "reserved" | "given_away" | "paused" | "removed";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export type Listing = {
  id: number;
  slug: string;
  title: string;
  /** Sanitised rich text (HTML) from the listing editor. */
  description: string;
  /** Plain-text version of the description, for previews and meta tags. */
  description_text: string;
  details: {
    brand: string | null;
    model: string | null;
    quantity: number;
    colour: string | null;
    dimensions: string | null;
    item_age: string | null;
    included_items: string | null;
    known_defects: string | null;
  };
  state: { id: number; name?: string | null } | null;
  /** The giver's Local Government Area (area level only — never an address). */
  lga: { id: number; name?: string | null } | null;
  /** Approximate km between area centres, present when the visitor shared an area ("near me"). */
  distance_km?: number;
  handover_method: HandoverMethod | null;
  /** Private: only the giver and Gratis Castle staff receive this. */
  handover?: { method: HandoverMethod | null; method_label: string | null; pickup_address: string | null; pickup_phone: string | null; pickup_times: string | null };
  /** Owner only: true once claimed — the item can no longer be withdrawn. */
  is_locked?: boolean;
  /** Always true — Gratis Castle items are never sold. */
  is_free: true;
  condition: ListingCondition;
  condition_label: string;
  location: string;
  city: string | null;
  status: ListingStatus;
  status_label: string;
  moderation_status?: "pending" | "approved" | "rejected";
  is_demo: boolean;
  is_requestable: boolean;
  request_count: number;
  pending_request_count?: number;
  is_saved: boolean;
  is_owner: boolean;
  pickup: { available: boolean; area: string | null; times: string | null; instructions: string | null };
  delivery: { available: boolean; notes: string | null };
  fulfillment_notes: string | null;
  category?: Category | null;
  images?: { id: number; url: string }[];
  giver?: PublicProfile;
  viewer_request?: { id: number; status: RequestStatus; conversation_id: number | null; created_at: string };
  created_at: string;
  given_away_at: string | null;
};

export type PickupLocation = {
  id: number;
  state_id: number;
  name: string;
  area: string;
  address: string;
  landmark: string | null;
  opening_hours: string | null;
  phone: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  sort_order: number;
  requests_count?: number;
  state?: StateSummary;
};

export type StateSummary = { id: number; name: string; slug: string };

/** A Nigerian state with its pickup hubs. Pickup is offered only when `pickup_available`. */
export type NgState = StateSummary & {
  code: string;
  pickup_enabled: boolean;
  pickup_available: boolean;
  pickup_locations: PickupLocation[];
};

export type TimelineStep = { key: string; label: string; done: boolean; current: boolean };

/** A free order (claim). Item and delivery are always ₦0. */
export type ItemRequest = {
  id: number;
  order_number: string;
  status: RequestStatus;
  fulfillment_method: "pickup" | "delivery";
  fulfillment_stage: FulfillmentStage | null;
  fulfillment_stage_label: string | null;
  stage_updated_at: string | null;
  stage_note: string | null;
  timeline: TimelineStep[];
  introduction: string | null;
  preferred_arrangement: string | null;
  totals: { item: 0; delivery: 0; total: 0; currency: "NGN" };
  state?: StateSummary | null;
  pickup_location?: PickupLocation | null;
  /** Only present for the receiver and Gratis Castle staff — never the giver. */
  recipient?: {
    name: string | null;
    email: string | null;
    phone: string | null;
    alt_phone: string | null;
    delivery_address: string | null;
    delivery_city: string | null;
    delivery_landmark: string | null;
    delivery_notes: string | null;
  };
  listing?: Listing;
  requester?: PublicProfile;
  conversation_id?: number | null;
  created_at: string;
  claimed_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  received_at?: string | null;
  can_cancel?: boolean;
  can_confirm_receipt?: boolean;
  can_review?: boolean;
  review?: Review | null;
};

/** A receiver's feedback on a completed handoff, shown on the homepage. */
export type Review = {
  id: number;
  rating: number;
  comment: string | null;
  reviewer: PublicProfile;
  item_title: string | null;
  created_at: string | null;
};

export type Account = {
  id: number;
  slug: string;
  name: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  state: StateSummary | null;
  lga: { id: number; name: string | null } | null;
  role: "member" | "moderator" | "admin";
  is_moderator: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  contact_preference: "in_app" | "email" | "phone";
  notification_preferences: Record<string, boolean>;
  member_since: string | null;
  safety_acknowledged: boolean;
  claims: { this_month: number; monthly_limit: number };
};

export type Session = {
  user: Account;
  unreadNotifications: number;
  unreadConversations: number;
};

export type Paginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  links: { next: string | null; prev: string | null };
};

export type CommunityStats = {
  items_shared: number;
  items_rehomed: number;
  members: number;
  communities: number;
};

export type LocationOption = { label: string; value: string; count: number };

export type Announcement = { id: number; title: string; body: string; published_at: string | null };
