import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { AlertTriangle, BadgeCheck, CalendarDays, ChevronRight, Hash, Info, MapPin, Package, PackageCheck, Palette, Ruler, ShieldCheck, Sparkles, Tag, Timer, Truck, type LucideIcon } from "lucide-react";
import { RichTextContent } from "@/components/editor/rich-text-editor";
import { ItemActions } from "@/components/items/item-actions";
import { ItemCard } from "@/components/items/item-card";
import { ListingGallery } from "@/components/items/listing-gallery";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { CONDITION_LABELS, LISTING_STATUS_LABELS, toListingRow } from "@/lib/gapcastle";
import { ServerApiError, getListing, getRelatedListings, getStates } from "@/lib/server/api";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, categoryPath, listingPath, profilePath } from "@/lib/site";
import type { Listing, NgState } from "@/lib/types";

const ITEM_CONDITION: Record<Listing["condition"], string> = {
  brand_new: "https://schema.org/NewCondition",
  like_new: "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  fair: "https://schema.org/UsedCondition",
  needs_repair: "https://schema.org/DamagedCondition",
};

/**
 * Server-rendered item detail page. Desktop: gallery + details on the left and a
 * sticky "request box" on the right. Phones: edge-to-edge gallery, stacked
 * sections and a sticky action bar (rendered by ItemActions).
 */
export async function ItemPage({ slug }: { slug: string }) {
  let listing: Listing;

  try {
    listing = (await getListing(slug)).data;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const canonicalSlug = listing.slug || String(listing.id);

  // Old numeric links resolve on the API; send visitors to the canonical slug.
  if (listing.slug && listing.slug !== slug) {
    permanentRedirect(listingPath(listing.slug));
  }

  const [related, hubStates] = await Promise.all([
    listing.status === "available" ? relatedListings(listing.id) : Promise.resolve([]),
    getStates().then((response) => response.data.filter((state) => state.pickup_available)).catch((): NgState[] => []),
  ]);
  const giver = listing.giver;
  const images = listing.images ?? [];
  const statusLabel = listing.status === "available" ? null : LISTING_STATUS_LABELS[listing.status] ?? listing.status;
  const canonical = absoluteUrl(listingPath(canonicalSlug));
  const place = [listing.location, listing.city, listing.state?.name].filter(Boolean).join(", ");
  const facts = listing.details;
  const isGone = listing.status === "reserved" || listing.status === "given_away";

  const details: { icon: LucideIcon; label: string; value: React.ReactNode; href?: string }[] = [
    { icon: Tag, label: "Category", value: listing.category?.name ?? "Uncategorised", href: listing.category ? categoryPath(listing.category.slug) : undefined },
    { icon: Sparkles, label: "Condition", value: CONDITION_LABELS[listing.condition] ?? listing.condition_label },
    { icon: Hash, label: "Quantity", value: facts?.quantity && facts.quantity > 1 ? String(facts.quantity) : "1" },
    { icon: Package, label: "Brand", value: facts?.brand },
    { icon: Package, label: "Model", value: facts?.model },
    { icon: Palette, label: "Colour", value: facts?.colour },
    { icon: Ruler, label: "Size / dimensions", value: facts?.dimensions },
    { icon: Timer, label: "Approximate age", value: facts?.item_age },
    { icon: PackageCheck, label: "What's included", value: facts?.included_items },
    { icon: MapPin, label: "General area", value: place },
    { icon: CalendarDays, label: "Listed", value: <TimeAgo iso={listing.created_at} /> },
  ].filter((row) => !!row.value);

  return (
    <div className="container-page pb-6 pt-0 sm:pt-5">
      <JsonLd data={itemJsonLd(listing, canonical)} />

      <nav aria-label="Breadcrumb" className="mb-4 hidden flex-wrap items-center gap-1 text-sm text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/explore" className="hover:text-primary">Free items</Link>
        {listing.category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href={categoryPath(listing.category.slug)} className="hover:text-primary">{listing.category.name}</Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="max-w-64 truncate text-foreground" aria-current="page">{listing.title}</span>
      </nav>

      {listing.is_owner && listing.moderation_status === "pending" && (
        <p className="mb-4 mt-3 flex items-start gap-2 rounded-xl border border-brand-yellow-200 bg-highlight-soft px-4 py-3 text-sm text-highlight-soft-foreground sm:mt-0">
          <Info className="mt-0.5 size-4 shrink-0" /> Your listing is waiting for a quick community review and will appear publicly once approved.
        </p>
      )}

      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        {/* Gallery */}
        <div className="min-w-0">
          <ListingGallery images={images} title={listing.title} statusLabel={statusLabel} />
        </div>

        {/* Request box */}
        <aside className="min-w-0 lg:row-span-2">
          <div className="lg:sticky lg:top-36">
            <div className="sm:rounded-3xl sm:border sm:border-border sm:bg-card sm:p-6 lg:shadow-soft">
              <div className="flex flex-wrap items-center gap-1.5">
                {listing.category && (
                  <Link href={categoryPath(listing.category.slug)}><Badge variant="secondary">{listing.category.name}</Badge></Link>
                )}
                <Badge variant="outline">{CONDITION_LABELS[listing.condition] ?? listing.condition_label}</Badge>
                {listing.is_demo && <Badge variant="muted">Demo</Badge>}
              </div>

              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{listing.title}</h1>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary">Free</span>
                <span className="text-sm text-muted-foreground">· no payment for the item or delivery</span>
              </div>

              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {place}</span>
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" /> <TimeAgo iso={listing.created_at} /></span>
                {isGone && <span className="inline-flex items-center gap-1 font-semibold text-foreground"><PackageCheck className="size-4" /> Given away</span>}
              </p>

              <ItemActions
                listingId={listing.id}
                listingSlug={canonicalSlug}
                title={listing.title}
                status={listing.status}
                isRequestable={listing.is_requestable}
                isOwner={listing.is_owner}
                isSaved={listing.is_saved}
                viewerRequest={listing.viewer_request ?? null}
              />

              <CollectionOptions hubStates={hubStates} />
            </div>

            {giver && (
              <div className="mt-4 rounded-3xl border border-border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Shared by</p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar url={giver.avatar_url} name={giver.name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <Link href={profilePath(giver.slug)} className="font-bold hover:text-primary">{giver.name}</Link>
                    <p className="text-xs text-muted-foreground">
                      Member since {new Date(giver.member_since ?? listing.created_at).getFullYear()}
                      {giver.location ? ` · ${giver.location}` : ""}
                    </p>
                  </div>
                  <Link href={profilePath(giver.slug)} aria-label={`View ${giver.name}'s profile`} className="flex size-9 items-center justify-center rounded-full hover:bg-muted">
                    <ChevronRight className="size-5" />
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {giver.trust.email_verified && <Badge variant="success"><BadgeCheck className="size-3" /> Email verified</Badge>}
                  {giver.trust.phone_verified && <Badge variant="success"><ShieldCheck className="size-3" /> Phone verified</Badge>}
                  {typeof giver.trust.items_shared === "number" && (
                    <Badge variant="secondary">{giver.trust.items_shared} item{giver.trust.items_shared === 1 ? "" : "s"} rehomed</Badge>
                  )}
                  {typeof giver.trust.active_listings === "number" && (
                    <Badge variant="secondary">{giver.trust.active_listings} active listing{giver.trust.active_listings === 1 ? "" : "s"}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Description & details */}
        <div className="min-w-0 space-y-4">
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="about-title">
            <h2 id="about-title" className="text-lg font-bold">About this item</h2>
            <RichTextContent html={listing.description} className="mt-3 leading-relaxed text-foreground/85" />
            {facts?.known_defects && (
              <div className="mt-4 flex gap-3 rounded-xl border border-brand-yellow-300 bg-highlight-soft px-4 py-3 text-sm text-highlight-soft-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p><strong>Known faults or damage:</strong> <span className="whitespace-pre-line">{facts.known_defects}</span></p>
              </div>
            )}
            {listing.fulfillment_notes && (
              <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"><strong className="text-foreground">Handling note:</strong> {listing.fulfillment_notes}</p>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 sm:p-6" aria-labelledby="details-title">
            <h2 id="details-title" className="text-lg font-bold">Item details</h2>
            <dl className="mt-3 divide-y divide-border">
              {details.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="flex items-center gap-2 text-muted-foreground"><row.icon className="size-4" /> {row.label}</dt>
                  <dd className="text-right font-semibold">
                    {row.href ? <Link href={row.href} className="text-primary hover:underline">{row.value}</Link> : row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {listing.is_demo && (
            <p className="text-xs text-muted-foreground">
              This is demo content shown to illustrate the community. Sign in with your own account to try the checkout.
            </p>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10 pb-16 lg:pb-0" aria-labelledby="related-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="related-title" className="text-xl font-extrabold">More in {listing.category?.name ?? "this category"}</h2>
            {listing.category && (
              <Link href={categoryPath(listing.category.slug)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">See all <ChevronRight className="size-4" /></Link>
            )}
          </div>
          <div className="scrollbar-none -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {related.map((item) => <ItemCard key={item.id} listing={item} className="w-[44%] shrink-0 snap-start sm:w-auto" />)}
          </div>
        </section>
      )}
    </div>
  );
}

function CollectionOptions({ hubStates }: { hubStates: NgState[] }) {
  const names = hubStates.map((state) => state.name.replace(" (FCT)", ""));
  return (
    <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
      <div className="flex gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><MapPin className="size-5" /></span>
        <div className="text-sm">
          <p className="font-bold">Collect at our pickup hub</p>
          <p className="text-muted-foreground">
            {names.length ? <>Available in {names.join(", ")}.</> : "Pickup hubs are opening soon."}{" "}
            <Link href="/pickup-hubs" className="font-semibold text-primary hover:underline">See hubs</Link>
          </p>
        </div>
      </div>
      <div className="flex gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight-soft text-highlight-soft-foreground"><Truck className="size-5" /></span>
        <div className="text-sm">
          <p className="font-bold">Delivery, paid by you</p>
          <p className="text-muted-foreground">Anywhere in Nigeria. You cover the delivery cost — we confirm the exact fee on your order before dispatch. Never pay anyone for the item itself.</p>
        </div>
      </div>
    </div>
  );
}

async function relatedListings(listingId: number) {
  try {
    const response = await getRelatedListings(listingId);
    return response.data.map(toListingRow);
  } catch {
    return [];
  }
}

function itemJsonLd(listing: Listing, canonical: string) {
  const images = (listing.images ?? []).map((image) => image.url);
  const available = listing.status === "available";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonical}#item`,
        name: listing.title,
        description: listing.description_text,
        image: images.length > 0 ? images : undefined,
        itemCondition: ITEM_CONDITION[listing.condition],
        category: listing.category?.name,
        url: canonical,
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "NGN",
          availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
          areaServed: { "@type": "Country", name: "Nigeria" },
          url: canonical,
          seller: listing.giver
            ? { "@type": "Person", name: listing.giver.name, url: absoluteUrl(profilePath(listing.giver.slug)) }
            : undefined,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Explore", item: absoluteUrl("/explore") },
          ...(listing.category
            ? [{ "@type": "ListItem", position: 3, name: listing.category.name, item: absoluteUrl(categoryPath(listing.category.slug)) }]
            : []),
          { "@type": "ListItem", position: listing.category ? 4 : 3, name: listing.title, item: canonical },
        ],
      },
    ],
  };
}
