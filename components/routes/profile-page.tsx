import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BadgeCheck, CalendarDays, Gift, MapPin, Package, ShieldCheck } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { ProfileActions } from "@/components/profile/profile-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toListingRow } from "@/lib/gapcastle";
import { ServerApiError, getProfile } from "@/lib/server/api";
import { absoluteUrl, profilePath } from "@/lib/site";
import { memberSince } from "@/lib/utils";

/**
 * Server-rendered public member profile. The profile details and their items
 * are crawlable; reporting and blocking stay in a small client island.
 */
export async function ProfilePage({ slug }: { slug: string }) {
  let profile: Awaited<ReturnType<typeof getProfile>>;

  try {
    profile = await getProfile(slug);
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const member = profile.data;
  const canonicalSlug = member.slug || String(member.id);

  if (member.slug && member.slug !== slug) {
    permanentRedirect(profilePath(member.slug));
  }

  const listings = profile.listings.map(toListingRow);

  return (
    <div className="container-page py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: member.name,
            url: absoluteUrl(profilePath(canonicalSlug)),
            image: member.avatar_url ?? undefined,
            description: member.bio ?? undefined,
            homeLocation: member.location ? { "@type": "Place", name: member.location } : undefined,
            memberOf: { "@type": "Organization", name: "Gap Castle Community" },
          }),
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/community" className="hover:text-primary">Community</Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-foreground" aria-current="page">{member.name}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="h-28 bg-gradient-to-r from-primary via-primary-400 to-highlight sm:h-36" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar url={member.avatar_url} name={member.name} className="size-24 border-4 border-card text-2xl" />
            <div className="flex flex-wrap gap-2">
              <ProfileActions
                userId={member.id}
                name={member.name}
                isBlocked={profile.meta.is_blocked}
                isSelf={profile.meta.is_self}
              />
            </div>
          </div>
          <h1 className="mt-4 flex flex-wrap items-center gap-2 text-2xl font-bold sm:text-3xl">
            {member.name}
            {member.is_demo && <Badge variant="muted">Demo member</Badge>}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {member.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {member.location}</span>}
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> Member since {memberSince(member.member_since)}</span>
          </div>
          {member.bio && <p className="mt-4 max-w-2xl leading-relaxed text-foreground/90">{member.bio}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {member.trust.email_verified && <Badge variant="success"><BadgeCheck className="size-3" /> Email verified</Badge>}
            {member.trust.phone_verified && <Badge variant="success"><ShieldCheck className="size-3" /> Phone verified</Badge>}
            <Badge variant="secondary"><Gift className="size-3" /> {member.trust.items_shared ?? 0} rehomed</Badge>
            <Badge variant="secondary"><Package className="size-3" /> {member.trust.active_listings ?? 0} available now</Badge>
          </div>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="profile-listings">
        <h2 id="profile-listings" className="text-xl font-bold">Free items from {member.name.split(" ")[0]}</h2>
        {listings.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => <ItemCard key={listing.id} listing={listing} />)}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No items shared right now.
          </p>
        )}
      </section>
    </div>
  );
}
