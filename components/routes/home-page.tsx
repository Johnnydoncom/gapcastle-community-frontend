import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ChevronRight,
  Gift,
  HandHeart,
  HeartHandshake,
  LayoutGrid,
  MapPin,
  Megaphone,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { ImpactStats } from "@/components/home/impact-stats";
import { ItemCard, ItemCardSkeleton } from "@/components/items/item-card";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { Button } from "@/components/ui/button";
import { categoryIcon, toListingRow, type ListingRow } from "@/lib/gapcastle";
import { getAnnouncements, getCategories, getListings, getStates, getStats, type ListingQuery } from "@/lib/server/api";
import { categoryPath, listingPath } from "@/lib/site";
import type { Category, CommunityStats, Listing, NgState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Marketplace home. Desktop: category sidebar · hero banner · promo column, then
 * product rails. Phones: an app-style feed — compact banner, round category
 * shortcuts and swipeable rails. All data is real; nothing is hardcoded.
 */
export function HomePage() {
  return (
    <div className="pb-6">
      <section className="container-page px-0 sm:px-[1rem] pt-0 sm:pt-3 sm:pt-6" aria-label="Welcome">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          {/* <aside className="hidden lg:block">
            <Suspense fallback={<div className="h-full min-h-80 animate-pulse rounded-2xl bg-card" />}>
              <CategorySidebar />
            </Suspense>
          </aside> */}

          <Suspense fallback={<HeroBanner photos={[]} />}>
            <HeroWithPhotos />
          </Suspense>

          <div className="hidden gap-4 xl:grid xl:grid-rows-2">
            <GivePromo />
            <Suspense fallback={<div className="animate-pulse rounded-2xl bg-card" />}>
              <HubsPromo />
            </Suspense>
          </div>
        </div>
      </section>

      <ValueStrip />

      <Suspense fallback={null}>
        <AnnouncementBar />
      </Suspense>

      <Suspense fallback={<CategoryShortcutsSkeleton />}>
        <CategoryShortcuts />
      </Suspense>

      <Rail title="Just listed" eyebrow="Fresh today" href="/explore?sort=newest" query={{ sort: "newest", available_only: true, per_page: 10 }} emptyCta />

      <section className="container-page mt-8 xl:hidden" aria-label="Get started">
        <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0">
          <GivePromo className="w-[85%] shrink-0 snap-start sm:w-auto" />
          <Suspense fallback={null}>
            <HubsPromo className="w-[85%] shrink-0 snap-start sm:w-auto" />
          </Suspense>
        </div>
      </section>

      <Rail title="Most requested" eyebrow="Popular in the community" href="/explore?sort=most_requested" query={{ sort: "most_requested", available_only: true, per_page: 10 }} />

      {/* <Suspense fallback={null}>
        <PickupHubsSection />
      </Suspense> */}

      <Suspense fallback={<ImpactStatsSkeleton />}>
        <ImpactStatsSection />
      </Suspense>

      <HowItWorks />

      <CommunityBand />
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

async function HeroWithPhotos() {
  const photos = await getListings({ sort: "newest", available_only: true, per_page: 12 })
    .then(({ data }) => data.filter((item) => item.images?.[0]?.url).slice(0, 3))
    .catch((): Listing[] => []);

  return <HeroBanner photos={photos} />;
}

function HeroBanner({ photos }: { photos: Listing[] }) {
  return (
    <div className="relative isolate overflow-hidden rounded-none bg-primary-700 text-white sm:rounded-3xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_0%_0%,var(--color-primary-500)_0%,var(--color-primary-700)_45%,var(--color-primary-900)_100%)]" />
      <div className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-yellow-400/20 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 -z-10 size-64 rounded-full bg-primary-400/30 blur-3xl" />

      <div className="grid items-center gap-6 py-8 p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] lg:p-9">
        <div className="max-w-xl animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-yellow-200 ring-1 ring-white/15 sm:text-sm">
            <HeartHandshake className="size-4" /> Nigeria&apos;s free community marketplace
          </p>
          <h1 className="mt-4 text-[28px] font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[42px] xl:text-[38px]">
            Give what you don&apos;t need. <span className="text-brand-yellow-300">Find what you do.</span>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-100 sm:mt-4 sm:text-base">
            Useful things shared freely by people near you. Request an item, then collect it at a pickup hub or get it by waybill — the item is always free.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            <Button asChild size="lg" variant="highlight" className="h-11 px-5">
              <Link href="/explore"><PackageSearch className="size-4" /> Explore free items</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 border-white/30 bg-white/5 px-5 text-white hover:border-white/60 hover:bg-white/10 hover:text-white">
              <Link href="/give"><Gift className="size-4" /> Give something away</Link>
            </Button>
          </div>
          <ul className="mt-5 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-primary-100 sm:flex">
            <li className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-brand-yellow-300" /> Always free</li>
            <li className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-brand-yellow-300" /> Pickup hubs</li>
            <li className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-brand-yellow-300" /> Addresses stay private</li>
          </ul>
        </div>

        {photos.length > 0 && (
          <div className="relative hidden h-56 w-48 md:block lg:h-60 lg:w-52" aria-hidden="true">
            {photos.map((listing, index) => (
              <Link
                key={listing.id}
                href={listingPath(listing.slug)}
                tabIndex={-1}
                className={cn(
                  "absolute overflow-hidden rounded-2xl border-4 border-white/90 bg-white shadow-2xl transition-transform duration-300 hover:z-10 hover:scale-105",
                  index === 0 && "right-0 top-0 h-36 w-32 rotate-3 lg:h-40 lg:w-36",
                  index === 1 && "bottom-0 left-0 h-32 w-28 -rotate-6 lg:h-36 lg:w-32",
                  index === 2 && "bottom-3 right-1 h-24 w-24 rotate-6",
                )}
              >
                {listing.images?.[0]?.url && <Image src={listing.images[0].url} alt="" fill sizes="144px" className="object-cover" />}
                <span className="absolute bottom-1.5 left-1.5 rounded bg-highlight px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-highlight-foreground">FREE</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function CategorySidebar() {
  const categories = await getCategories().then((response) => response.data).catch((): Category[] => []);

  return (
    <nav aria-label="Browse categories" className="flex h-full flex-col rounded-2xl border border-border bg-card p-2">
      <p className="flex items-center gap-2 px-3 pb-2 pt-2 text-sm font-bold"><LayoutGrid className="size-4 text-primary" /> Categories</p>
      <ul className="flex-1">
        {categories.slice(0, 10).map((category) => {
          const Icon = categoryIcon(category.icon);
          return (
            <li key={category.id}>
              <Link href={categoryPath(category.slug)} className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-primary-50 hover:text-primary-700">
                <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="flex-1 truncate">{category.name}</span>
                <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/categories" className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-50">
        All categories <ArrowRight className="size-4" />
      </Link>
    </nav>
  );
}

function GivePromo({ className }: { className?: string }) {
  return (
    <Link href="/give" className={cn("group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-highlight p-5 text-highlight-foreground transition-transform active:scale-[0.98]", className)}>
      <Gift className="absolute -bottom-4 -right-4 size-28 rotate-12 text-brand-yellow-600/30" strokeWidth={1.5} />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow-800">Have something spare?</p>
        <p className="mt-1.5 text-lg font-extrabold leading-snug">Give it a second home in under 2 minutes.</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold">Give an item <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

async function HubsPromo({ className }: { className?: string }) {
  const states = await getStates().then((response) => response.data.filter((state) => state.pickup_available)).catch((): NgState[] => []);

  return (
    <Link href="/pickup-hubs" className={cn("group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow] hover:shadow-lift active:scale-[0.98]", className)}>
      <MapPin className="absolute -bottom-4 -right-3 size-28 text-primary-50" strokeWidth={1.5} />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Pickup hubs</p>
        <p className="mt-1.5 text-lg font-extrabold leading-snug">
          {states.length > 0 ? `Collect in ${formatList(states.map((state) => state.name.replace(" (FCT)", "")))}` : "Collect from a Gap Castle hub"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">No hub in your state? Get it by waybill.</p>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">Find a hub <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

function ValueStrip() {
  const items = [
    { icon: Sparkles, title: "100% free", text: "No prices, ever" },
    { icon: MapPin, title: "Pickup hubs", text: "Collect in your state" },
    { icon: Truck, title: "Waybill", text: "Anywhere in Nigeria" },
    { icon: ShieldCheck, title: "Private & safe", text: "Addresses stay hidden" },
  ];

  return (
    <section className="container-page mt-4" aria-label="Why Gap Castle">
      <ul className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border sm:overflow-visible sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:px-0 sm:py-1">
        {items.map((item) => (
          <li key={item.title} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-5 sm:py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"><item.icon className="size-[18px]" /></span>
            <span className="leading-tight"><span className="block text-sm font-bold">{item.title}</span><span className="text-xs text-muted-foreground">{item.text}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function AnnouncementBar() {
  const announcement = await getAnnouncements()
    .then(({ data }) => data[0] ?? null)
    .catch(() => null);

  if (!announcement) return null;

  return (
    <section className="container-page mt-4" aria-label="Community announcement">
      <div className="flex items-start gap-3 rounded-2xl border border-brand-yellow-200 bg-highlight-soft px-4 py-3 text-sm text-highlight-soft-foreground">
        <Megaphone className="mt-0.5 size-4 shrink-0" />
        <p><strong>{announcement.title}</strong> <span className="opacity-90">— {announcement.body}</span></p>
      </div>
    </section>
  );
}

/* ------------------------------- Categories ------------------------------- */

async function CategoryShortcuts() {
  const categories = await getCategories().then((response) => response.data).catch((): Category[] => []);
  if (!categories.length) return null;

  return (
    <section className="container-page mt-8" aria-labelledby="categories-title">
      <SectionHeader id="categories-title" eyebrow="Browse" title="Shop by category" href="/categories" linkLabel="All categories" />
      <ul className="scrollbar-none -mx-4 mt-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:px-0 lg:grid-cols-10">
        {categories.map((category) => {
          const Icon = categoryIcon(category.icon);
          return (
            <li key={category.id} className="w-[76px] shrink-0 sm:w-auto">
              <Link href={categoryPath(category.slug)} className="group flex flex-col items-center gap-2 rounded-2xl p-1.5 text-center transition-transform active:scale-95 sm:p-2">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-soft ring-1 ring-border transition-all group-hover:-translate-y-0.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lift sm:size-16">
                  <Icon className="size-6" />
                </span>
                <span className="line-clamp-2 text-xs font-semibold leading-tight">{category.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function CategoryShortcutsSkeleton() {
  return (
    <section className="container-page mt-8" aria-hidden="true">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-4 flex gap-3 overflow-hidden">
        {Array.from({ length: 10 }).map((_, index) => <div key={index} className="size-16 shrink-0 animate-pulse rounded-2xl bg-muted" />)}
      </div>
    </section>
  );
}

/* ---------------------------------- Rails --------------------------------- */

function Rail({ title, eyebrow, href, query, emptyCta = false }: { title: string; eyebrow: string; href: string; query: ListingQuery; emptyCta?: boolean }) {
  const id = `rail-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section className="container-page mt-8 sm:mt-10" aria-labelledby={id}>
      <SectionHeader id={id} eyebrow={eyebrow} title={title} href={href} linkLabel="See all" />
      <Suspense fallback={<RailSkeleton />}>
        <RailItems query={query} emptyCta={emptyCta} />
      </Suspense>
    </section>
  );
}

const railClass = "scrollbar-none -mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-5";
const railItemClass = "w-[44%] shrink-0 snap-start min-[480px]:w-[31%] sm:w-auto";

async function RailItems({ query, emptyCta }: { query: ListingQuery; emptyCta: boolean }) {
  const listings = await getListings(query)
    .then((response) => response.data.map(toListingRow))
    .catch((): ListingRow[] | null => null);

  if (!listings) {
    return <EmptyState title="We couldn't load these items." text="Please refresh the page to try again." />;
  }

  if (!listings.length) {
    return emptyCta ? (
      <EmptyState title="A fresh start for good things." text="Be the first to share an item with your community." action={<Button asChild className="mt-4"><Link href="/give">Give an item</Link></Button>} />
    ) : null;
  }

  return (
    <div className={railClass}>
      {listings.map((listing, index) => (
        <ItemCard key={listing.id} listing={listing} className={cn(railItemClass, index >= 6 && "sm:hidden lg:flex")} />
      ))}
    </div>
  );
}

function RailSkeleton() {
  return (
    <div className={railClass}>
      {Array.from({ length: 5 }).map((_, index) => <ItemCardSkeleton key={index} className={railItemClass} />)}
    </div>
  );
}

/* ------------------------------- Pickup hubs ------------------------------- */

async function PickupHubsSection() {
  const states = await getStates().then((response) => response.data.filter((state) => state.pickup_available)).catch((): NgState[] => []);
  if (!states.length) return null;

  return (
    <section className="container-page mt-10" aria-labelledby="hubs-title">
      <SectionHeader id="hubs-title" eyebrow="Collect it yourself" title="Gap Castle pickup hubs" href="/pickup-hubs" linkLabel="All hubs" />
      <div className="scrollbar-none -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {states.map((state) => (
          <Link key={state.id} href={`/pickup-hubs#${state.slug}`} className="group w-[72%] shrink-0 snap-start rounded-2xl border border-border bg-card p-4 transition-[box-shadow,transform] hover:shadow-lift active:scale-[0.98] sm:w-auto">
            <div className="flex items-center justify-between">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MapPin className="size-5" /></span>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">Open</span>
            </div>
            <p className="mt-3 font-bold">{state.name}</p>
            <p className="text-sm text-muted-foreground">{state.pickup_locations.length} hub{state.pickup_locations.length === 1 ? "" : "s"} · {formatList(state.pickup_locations.slice(0, 2).map((hub) => hub.area))}</p>
          </Link>
        ))}
        <div className="w-[72%] shrink-0 snap-start rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-4 sm:w-auto">
          <span className="flex size-10 items-center justify-center rounded-xl bg-card text-primary"><Truck className="size-5" /></span>
          <p className="mt-3 font-bold">Anywhere else in Nigeria</p>
          <p className="text-sm text-muted-foreground">Choose waybill delivery when you request — the item stays free.</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Impact & more ------------------------------ */

const EMPTY_STATS: CommunityStats = { items_shared: 0, items_rehomed: 0, members: 0, communities: 0 };

async function ImpactStatsSection() {
  const stats = await getStats()
    .then((response) => response.data)
    .catch((): CommunityStats => EMPTY_STATS);

  return <ImpactStats stats={stats} />;
}

function ImpactStatsSkeleton() {
  return (
    <section className="container-page mt-10" aria-hidden="true">
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: PackageSearch, title: "Find something useful", text: "Browse free items shared across Nigeria and save the ones you like." },
    { icon: HandHeart, title: "Request it — free", text: "Introduce yourself, choose a pickup hub in your state or waybill delivery." },
    { icon: MessageCircle, title: "Collect safely", text: "When the giver accepts, Gap Castle handles the handover — you collect from the hub. No meetups, ever." },
  ];

  return (
    <section id="how-it-works" className="container-page mt-10 scroll-mt-28" aria-labelledby="how-title">
      <SectionHeader id="how-title" eyebrow="How it works" title="Three simple steps" href="/how-it-works" linkLabel="Full guide" />
      <ol className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-col sm:p-6">
            <span className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <step.icon className="size-6" />
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-highlight text-[11px] font-extrabold text-highlight-foreground">{index + 1}</span>
            </span>
            <div>
              <h3 className="font-bold">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CommunityBand() {
  return (
    <section id="community" className="container-page mt-10 scroll-mt-28">
      <div className="relative isolate overflow-hidden rounded-3xl bg-primary-800 p-6 text-white sm:p-10">
        <div className="absolute -right-20 -top-20 -z-10 size-72 rounded-full bg-brand-yellow-400/15 blur-3xl" />
        <div className="grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow-300">Our community</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">Small acts of giving. Big community impact.</h2>
            <p className="mt-3 max-w-lg text-sm text-primary-100 sm:text-base">Your unused items could change someone&apos;s day. Join neighbours who give freely, receive gratefully and look out for one another.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button asChild size="lg" variant="highlight"><Link href="/auth?mode=join">Join the community</Link></Button>
            <InstallAppButton size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Helpers -------------------------------- */

function SectionHeader({ id, eyebrow, title, href, linkLabel }: { id: string; eyebrow: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 id={id} className="mt-0.5 text-xl font-extrabold sm:text-2xl">{title}</h2>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary-50">
        {linkLabel} <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} & ${items.at(-1)}`;
}
