import Link from "next/link";
import { Quote, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { TimeAgo } from "@/components/ui/time-ago";
import { getReviews } from "@/lib/server/api";
import { profilePath } from "@/lib/site";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Recent receiver reviews, rendered on the server so crawlers see real stories. */
export async function ReviewsSection() {
  const reviews = await getReviews()
    .then(({ data }) => data)
    .catch((): Review[] => []);

  if (!reviews.length) return null;

  const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;

  return (
    <section className="container-page mt-10" aria-labelledby="reviews-title">
      <div className="relative isolate overflow-hidden rounded-3xl border border-brand-yellow-200 bg-highlight-soft p-5 sm:p-8">
        <div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-yellow-300/30 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 -z-10 size-64 rounded-full bg-primary-100/70 blur-3xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-highlight-soft-foreground">Community voices</p>
            <h2 id="reviews-title" className="mt-0.5 text-xl font-extrabold sm:text-2xl">Good things, in their own words</h2>
            <p className="mt-1 text-sm text-highlight-soft-foreground/80">
              Real notes from receivers who confirmed their handoff — the people who know a free item found a good home.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-full bg-card px-3 py-1.5 shadow-soft ring-1 ring-border">
            <Stars rating={average} />
            <span className="text-sm font-bold tabular-nums">{average.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">from {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 6).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewsSectionSkeleton() {
  return (
    <section className="container-page mt-10" aria-hidden="true">
      <div className="h-80 animate-pulse rounded-3xl bg-muted sm:h-72" />
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Quote className="size-7 text-brand-yellow-500" strokeWidth={1.5} aria-hidden="true" />
      <div className="mt-3">
        <Stars rating={review.rating} />
      </div>
      <p className="mt-3 line-clamp-5 flex-1 text-sm leading-relaxed text-foreground/90">
        &ldquo;{review.comment}&rdquo;
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <Avatar url={review.reviewer.avatar_url} name={review.reviewer.name} className="size-10" />
        <div className="min-w-0">
          <Link href={profilePath(review.reviewer.slug)} className="block truncate text-sm font-bold hover:text-primary">
            {review.reviewer.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {review.item_title ? `Received “${review.item_title}”` : "Community member"}
            {review.created_at ? <> · <TimeAgo iso={review.created_at} /></> : null}
          </p>
        </div>
      </div>
    </article>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn("size-4", index < Math.round(rating) ? "fill-brand-yellow-400 text-brand-yellow-500" : "text-muted-foreground/30")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
