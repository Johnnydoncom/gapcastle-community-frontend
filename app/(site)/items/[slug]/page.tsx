import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemPage } from "@/components/routes/item-page";
import { ServerApiError, getListing } from "@/lib/server/api";
import { absoluteUrl, listingPath } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

const FALLBACK_IMAGE = "/brand/logo-lockup-768x553.png";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data: listing } = await getListing(slug);
    const canonical = listingPath(listing.slug || String(listing.id));
    const images = (listing.images ?? []).map((image) => image.url);
    const description = (listing.description_text ?? listing.description).replace(/\s+/g, " ").slice(0, 158).trim();
    const indexable = listing.status !== "removed" && listing.status !== "paused" && listing.moderation_status !== "rejected";

    const locationDesc = [listing.location, listing.city, "Nigeria"].filter(Boolean).join(", ");
    const categoryName = listing.category?.name ?? "Items";
    const richDescription = `${description} Free to a good home in ${locationDesc}.`;

    return {
      title: `${listing.title} — Free in ${listing.location}`,
      description: richDescription,
      alternates: { canonical },
      robots: indexable ? undefined : { index: false, follow: false },
      keywords: [`free ${categoryName.toLowerCase()} ${listing.location}`, `free ${listing.title.toLowerCase()}`, `free items ${listing.location}`, "Gratis Castle"],
      openGraph: {
        type: "website",
        url: canonical,
        title: `${listing.title} — Free on Gratis Castle`,
        description: richDescription,
        images: images.length > 0 ? images.map((url) => ({ url })) : [{ url: FALLBACK_IMAGE, width: 768, height: 553 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${listing.title} — Free on Gratis Castle`,
        description: richDescription,
        images: images.length > 0 ? images : [FALLBACK_IMAGE],
      },
      other: {
        "product:price:amount": "0",
        "product:price:currency": "NGN",
        "geo.region": "NG",
        "geo.placename": listing.location,
        "og:see_also": absoluteUrl("/explore"),
      },
    };
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) {
      return { title: "Item not found", robots: { index: false, follow: false } };
    }
    throw error;
  }
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<ItemPageSkeleton />}>
      {params.then(({ slug }) => <ItemPage slug={slug} />)}
    </Suspense>
  );
}

function ItemPageSkeleton() {
  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-2">
      <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-muted" />
      <div className="space-y-4">
        <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 w-full animate-pulse rounded bg-muted" />
        <div className="h-12 w-48 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
