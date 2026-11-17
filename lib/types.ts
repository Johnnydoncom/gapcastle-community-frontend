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

export type ListingCondition = "brand_new" | "like_new" | "good" | "fair";
export type ListingStatus = "available" | "reserved" | "given_away" | "paused" | "removed";
export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";

export type Listing = {
  id: number;
  slug: string;
  title: string;
  description: string;
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

export type DeliveryInfo = {
  method: "giver_delivers" | "courier" | "receiver_arranges";
  fee_amount: number | null;
  fee_currency: string;
  fee_payer: "none" | "receiver" | "giver" | "split";
  notes: string | null;
  provider: string | null;
  disclosed_at: string | null;
  receiver_confirmed_at: string | null;
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

export type ItemRequest = {
  id: number;
  status: RequestStatus;
  fulfillment_method: "pickup" | "delivery";
  introduction: string;
  reason: string | null;
  preferred_arrangement: string | null;
  state?: StateSummary | null;
  pickup_location?: PickupLocation | null;
  /** Only present for the receiver, and for the giver once the request is accepted. */
  recipient?: { phone: string | null; delivery_city: string | null; delivery_address: string | null };
  listing?: Listing;
  requester?: PublicProfile;
  conversation_id?: number | null;
  delivery?: DeliveryInfo | null;
  created_at: string;
  responded_at: string | null;
  completed_at: string | null;
};

export type Account = {
  id: number;
  slug: string;
  name: string;
  email: string;
  email_verified: boolean;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  state: StateSummary | null;
  role: "member" | "moderator" | "admin";
  is_moderator: boolean;
  is_admin: boolean;
  is_suspended: boolean;
  contact_preference: "in_app" | "email" | "phone";
  notification_preferences: Record<string, boolean>;
  member_since: string | null;
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
