import Link from "next/link";
import { createElement, Suspense } from "react";
import {
  ArrowRight,
  ChevronRight,
  Gift,
  LayoutGrid,
  MapPin,
  Megaphone,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { AreaPicker } from "@/components/home/area-picker";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { HeroAccountCard } from "@/components/home/hero-account-card";
import { HowItWorksSteps } from "@/components/home/how-it-works";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { ImpactStatsGrid } from "@/components/home/impact-stats";
import { ReviewsSection, ReviewsSectionSkeleton } from "@/components/home/reviews-section";
import { ScrollRail } from "@/components/home/scroll-rail";
import { ItemCard, ItemCardSkeleton } from "@/components/items/item-card";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { SafetyStrip } from "@/components/safety/safety-strip";
import { Button } from "@/components/ui/button";
import { categoryIcon, toListingRow } from "@/lib/gapcastle";
import { getAnnouncements, getCategories, getListings, getStates, getStats } from "@/lib/server/api";
import { getVisitorArea } from "@/lib/server/area";
import { categoryPath } from "@/lib/site";
import type { Category, CommunityStats, Listing, NgState } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Marketplace home, server-rendered for SEO: every listing, category and link is
 * in the initial HTML. Client islands only add sliding, saving and the count-up.
 *
 * Order: marketplace hero (category menu · promo slider · quick actions) → promises & safety → categories → fresh items → how it works
 * (getting and giving) → popular items → reviews → community band with live stats.
 */
export function HomePage() {
  return (
    <div className="pb-8">
      {/* Classic marketplace hero: category menu · promo banner · quick actions. */}
      <section className="container-page pt-0 max-sm:px-0 sm:pt-5" aria-label="Welcome">
        <div className="grid gap-4 lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_264px]">
          <Suspense fallback={<div className="hidden animate-pulse rounded-3xl bg-card lg:block" />}>
            <CategoryMenu />
          </Suspense>
          <HeroSlider slides={HERO_SLIDES} />
          <QuickActions />
        </div>
      </section>

      <ValueStrip />
      <SafetyStrip className="mt-3" />

      <Suspense fallback={null}>
        <AnnouncementBar />
      </Suspense>

      <Suspense fallback={<SectionSkeleton tall={false} className="lg:hidden" />}>
        <CategoriesSection />
      </Suspense>

      <ProductSection id="rail-fresh" title="New Arrivals" href="/explore?sort=newest">
        <Suspense fallback={<RailSkeleton />}>
          <FreshRail />
        </Suspense>
      </ProductSection>

      {/* Personal (reads the visitor's area), so it streams in on its own; the rest of the page stays cached. */}
      <Suspense fallback={null}>
        <NearYouSection />
      </Suspense>

      <HowItWorks />

      <section className="container-page mt-10 xl:hidden" aria-label="Get started">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <GivePromo />
          <Suspense fallback={null}>
            <HubsPromo />
          </Suspense>
        </div>
      </section>

      <Suspense fallback={null}>
        <PopularRail />
      </Suspense>

      <Suspense fallback={<ReviewsSectionSkeleton />}>
        <ReviewsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton tall />}>
        <CommunityBand />
      </Suspense>
    </div>
  );
}

/* ---------------------------------- Hero ---------------------------------- */

const HERO_SLIDES: HeroSlide[] = [
  {
    key: "free",
    eyebrow: "Free community marketplace",
    title: "Give or pick an item",
    highlight: "for free.",
    text: "Useful things shared by people across Nigeria. Check out in seconds — the item and delivery cost ₦0.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1400&q=70",
    imagePosition: "50% 62%",
    tone: "blue",
    primary: { href: "/explore", label: "Pick an item for free" },
    secondary: { href: "/give", label: "Give an item" },
  },
  {
    key: "delivery",
    eyebrow: "₦0 delivery · anywhere in Nigeria",
    title: "No hub near you?",
    highlight: "We deliver free.",
    text: "Collect from our Lagos pickup hub, or choose delivery at checkout and Gratis Castle brings it to your door at no cost.",
    image: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1400&q=70",
    imagePosition: "center",
    tone: "navy",
    primary: { href: "/explore", label: "Find something free" },
    secondary: { href: "/pickup-hubs", label: "Pickup hub" },
  },
  {
    key: "repair",
    eyebrow: "Damaged but valuable",
    title: "Repair, reuse,",
    highlight: "give it new life.",
    text: "Broken but fixable? List it in Damaged but Valuable — someone handy will be glad to give it a second chance.",
    image: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=1400&q=70",
    imagePosition: "center",
    tone: "yellow",
    primary: { href: "/categories/damaged-but-valuable", label: "Browse repair & reuse" },
    secondary: { href: "/give", label: "Give a damaged item" },
  },
];

/** Marketplace category menu (desktop). Server-rendered, so every category link is crawlable. */
async function CategoryMenu() {
  const categories = await getCategories().then((response) => response.data).catch((): Category[] => []);

  return (
    <nav aria-label="Shop by category" className="hidden flex-col overflow-hidden rounded-3xl border border-border bg-card lg:flex">
      <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-bold">
        <LayoutGrid className="size-4 text-primary" /> Categories
      </p>
      <ul className="flex-1 py-1.5">
        {categories.slice(0, 10).map((category) => (
          <li key={category.id}>
            <Link href={categoryPath(category.slug)} className="group flex items-center gap-3 px-4 py-[7px] text-sm text-foreground/80 transition-colors hover:bg-primary-50 hover:text-primary">
              {createElement(categoryIcon(category.icon), { className: "size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" })}
              <span className="flex-1 truncate">{category.name}</span>
              <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/categories" className="flex items-center justify-between border-t border-border px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-50">
        All categories <ArrowRight className="size-4" />
      </Link>
    </nav>
  );
}

const QUICK_LINKS: { href: string; icon: LucideIcon; title: string; text: string }[] = [
  { href: "/give", icon: Gift, title: "Give an item", text: "List it in 2 minutes" },
  { href: "/account/requests", icon: Receipt, title: "Track my order", text: "See where your item is" },
  { href: "/pickup-hubs", icon: MapPin, title: "Pickup hub", text: "Collect in Lagos" },
  { href: "/safety", icon: ShieldCheck, title: "Safety tips", text: "Never pay for a free item" },
];

/** Right-hand column (wide screens): account card plus marketplace shortcuts. */
function QuickActions() {
  return (
    <aside aria-label="Quick actions" className="hidden flex-col gap-4 xl:flex">
      <HeroAccountCard />
      <ul className="flex-1 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {QUICK_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-50">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <link.icon className="size-[18px]" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-sm font-semibold">{link.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{link.text}</span>
              </span>
              <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function GivePromo({ className }: { className?: string }) {
  return (
    <Link href="/give" className={cn("group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl bg-highlight p-5 text-highlight-foreground transition-transform active:scale-[0.98]", className)}>
      <Gift className="absolute -bottom-5 -right-5 size-32 rotate-12 text-brand-yellow-600/25 transition-transform duration-500 group-hover:rotate-0" strokeWidth={1.5} />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow-800">Have something spare?</p>
        <p className="mt-1.5 text-lg font-extrabold leading-snug">Give it a second home in under 2 minutes.</p>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold">Give an item <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

async function HubsPromo({ className }: { className?: string }) {
  const states = await getStates().then((response) => response.data.filter((state) => state.pickup_available)).catch((): NgState[] => []);

  return (
    <Link href="/pickup-hubs" className={cn("group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-5 transition-[transform,box-shadow] hover:shadow-lift active:scale-[0.98]", className)}>
      <MapPin className="absolute -bottom-5 -right-4 size-32 text-primary-50 transition-transform duration-500 group-hover:-translate-y-1" strokeWidth={1.5} />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Pickup hub</p>
        <p className="mt-1.5 text-lg font-extrabold leading-snug">
          {states.length > 0 ? `Collect in ${formatList(states.map((state) => state.name.replace(" (FCT)", "")))}` : "Collect from a Gratis Castle hub"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">No hub in your state? We deliver it free.</p>
      </div>
      <span className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary">Find the hub <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

function ValueStrip() {
  const items = [
    { icon: Sparkles, title: "100% free", text: "No prices" },
    { icon: MapPin, title: "Pickup hub", text: "Collect from our hub" },
    { icon: Truck, title: "Free delivery", text: "Anywhere in Nigeria" },
    { icon: ShieldCheck, title: "Private & safe", text: "Addresses stay hidden" },
  ];

  return (
    <section className="container-page mt-4" aria-label="Why Gratis Castle">
      <ul className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-border sm:overflow-visible sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:px-0 sm:py-1">
        {items.map((item) => (
          <li key={item.title} className="flex shrink-0 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-5 sm:py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><item.icon className="size-5" /></span>
            <span className="leading-tight"><span className="block text-sm font-semibold">{item.title}</span><span className="text-xs text-muted-foreground">{item.text}</span></span>
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
    <section className="container-page mt-3" aria-label="Community announcement">
      <div className="flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-900">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" />
        <p><strong>{announcement.title}</strong> <span className="opacity-90">— {announcement.body}</span></p>
      </div>
    </section>
  );
}

/* ------------------------------- Categories ------------------------------- */

async function CategoriesSection() {
  const categories = await getCategories().then((response) => response.data).catch((): Category[] => []);
  if (!categories.length) return null;

  return (
    // Phones and tablets only: on large screens the hero's category menu already lists every category.
    <section className="container-page mt-10 sm:mt-14 lg:hidden" aria-labelledby="categories-title">
      <SectionHeader id="categories-title" eyebrow="Browse" title="Shop by category" href="/categories" linkLabel="All categories" />
      <div className="mt-5">
        <CategoryCarousel categories={categories} />
      </div>
    </section>
  );
}

/* ---------------------------------- Rails --------------------------------- */

const railItemClass = "w-[46%] shrink-0 snap-start min-[480px]:w-[31%] sm:w-[calc((100%-2*1rem)/3)] lg:w-[calc((100%-4*1rem)/5)]";

/** "Just listed" shows two rows; on desktop that is 2 × 4 cards. */
const JUST_LISTED_MAX = 8;

async function FreshRail() {
  const listings = await getListings({ sort: "newest", available_only: true, per_page: JUST_LISTED_MAX })
    .then((response) => response.data)
    .catch((): Listing[] | null => null);

  if (!listings) return <EmptyState title="We couldn't load these items." text="Please refresh the page to try again." />;
  if (!listings.length) {
    return (
      <EmptyState
        title="A fresh start for good things."
        text="Be the first to share an item with your community."
        action={<Button asChild className="mt-4"><Link href="/give">Give an item</Link></Button>}
      />
    );
  }

  // Always two rows: 2 per row on phones (4 items), 3 on tablets (6), 4 on desktop (8).
  const twoRows = (columns: number) => Math.min(listings.length, columns * 2);
  const visible = { base: twoRows(2), sm: twoRows(3), lg: twoRows(4) };

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {listings.slice(0, JUST_LISTED_MAX).map((listing, index) => (
        <li
          key={listing.id}
          className={cn(
            index < visible.base ? "flex" : "hidden",
            index < visible.sm ? "sm:flex" : "sm:hidden",
            index < visible.lg ? "lg:flex" : "lg:hidden",
          )}
        >
          <ItemCard listing={toListingRow(listing)} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

/**
 * "Near You": available items ranked by distance from the visitor's area (their chosen
 * area, account LGA/state, an approximate IP location, or Lagos by default), each with an
 * approximate "~5 km" label. Only area centres are used — never addresses.
 */
async function NearYouSection() {
  const area = await getVisitorArea();
  if (!area.stateId) return null;

  const listings = await getListings({
    sort: "nearest",
    near_lga: area.lgaId,
    near_state: area.lgaId ? null : area.stateId,
    available_only: true,
    per_page: 12,
  })
    .then((response) => response.data)
    .catch((): Listing[] => []);
  if (!listings.length) return null;

  return (
    <section className="container-page mt-10 sm:mt-14" aria-labelledby="rail-near">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <h2 id="rail-near" className="text-[22px] font-extrabold sm:text-[26px]">Near You</h2>
          <AreaPicker label={area.label} isGuess={area.source === "default" || area.source === "approximate"} className="hidden sm:inline-flex" />
        </div>
        <Link href="/explore?sort=nearest" className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary-200 hover:bg-primary-50">
          See all <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <AreaPicker label={area.label} isGuess={area.source === "default" || area.source === "approximate"} className="mt-2 sm:hidden" />
      <div className="mt-5">
        <ListingRail listings={listings} label="Near you" />
      </div>
    </section>
  );
}

/**
 * Items people are getting most, without repeating what "Just listed" already
 * shows. Hidden entirely when there is nothing different to show.
 */
async function PopularRail() {
  const [fresh, popular] = await Promise.all([
    getListings({ sort: "newest", available_only: true, per_page: JUST_LISTED_MAX }).then((response) => response.data).catch((): Listing[] => []),
    getListings({ sort: "most_requested", available_only: true, per_page: 24 }).then((response) => response.data).catch((): Listing[] => []),
  ]);
  const shown = new Set(fresh.map((item) => item.id));
  const listings = popular.filter((item) => !shown.has(item.id)).slice(0, 12);
  if (!listings.length) return null;

  return (
    <ProductSection id="rail-popular" title="Popular Right Now" href="/explore?sort=most_requested">
      <ListingRail listings={listings} label="Popular right now" />
    </ProductSection>
  );
}

function ListingRail({ listings, label }: { listings: Listing[]; label: string }) {
  return (
    <ScrollRail label={label}>
      {listings.map((listing) => (
        <li key={listing.id} className={cn(railItemClass, "flex")}>
          <ItemCard listing={toListingRow(listing)} className="w-full" />
        </li>
      ))}
    </ScrollRail>
  );
}

function RailSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: JUST_LISTED_MAX }).map((_, index) => <ItemCardSkeleton key={index} className={cn(index >= 4 && "hidden sm:block", index >= 6 && "sm:hidden lg:block")} />)}
    </div>
  );
}

/* ------------------------------ How it works ------------------------------ */

function HowItWorks() {
  return (
    <section id="how-it-works" className="container-page mt-10 scroll-mt-28 sm:mt-14" aria-labelledby="how-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="how-title" className="text-[22px] font-extrabold sm:text-[26px]">How It Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">Free, simple and safe — whether you&apos;re getting or giving.</p>
        </div>
        <Link href="/how-it-works" className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary-200 hover:bg-primary-50">
          Full guide <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-5">
        <HowItWorksSteps />
      </div>
    </section>
  );
}

/* ------------------------- Community band & stats ------------------------- */

const EMPTY_STATS: CommunityStats = { items_shared: 0, items_rehomed: 0, members: 0, communities: 0 };

async function CommunityBand() {
  const stats = await getStats().then((response) => response.data).catch((): CommunityStats => EMPTY_STATS);

  return (
    <section id="community" className="container-page mt-10 scroll-mt-28 sm:mt-14" aria-labelledby="community-title">
      <div className="relative isolate overflow-hidden rounded-3xl bg-primary-900 p-6 text-white sm:p-10">
        <div className="absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-brand-yellow-400/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 -z-10 size-80 rounded-full bg-primary-500/30 blur-3xl" />
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow-300">Our community</p>
            <h2 id="community-title" className="mt-2 text-2xl font-extrabold leading-tight sm:text-[34px]">Small acts of giving. Big community impact.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-primary-100 sm:text-base">
              Your unused items could change someone&apos;s day. Join neighbours across Nigeria who give freely, receive gratefully and look out for one another.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="highlight"><Link href="/auth?mode=join">Join the community</Link></Button>
              <InstallAppButton size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            </div>
          </div>
          <div>
            <ImpactStatsGrid stats={stats} />
            <p className="mt-3 text-xs text-primary-200">Live figures from real community activity — demo listings are not counted.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Helpers -------------------------------- */

/**
 * Product section heading in plain marketplace style: a bold title ("New Arrivals")
 * with "See all" on the right — no eyebrow label, no coloured bar or panel.
 */
function ProductSection({ id, title, href, children }: { id: string; title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="container-page mt-10 sm:mt-14" aria-labelledby={id}>
      <div className="flex items-center justify-between gap-4">
        <h2 id={id} className="text-[22px] font-extrabold sm:text-[26px]">{title}</h2>
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary-200 hover:bg-primary-50">
          See all <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SectionHeader({ id, eyebrow, title, href, linkLabel }: { id: string; eyebrow: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <span aria-hidden="true" className="h-0.5 w-5 rounded-full bg-highlight" /> {eyebrow}
        </p>
        <h2 id={id} className="mt-1 text-[22px] font-extrabold sm:text-[28px]">{title}</h2>
      </div>
      <Link href={href} className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary-200 hover:bg-primary-50">
        {linkLabel} <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function SectionSkeleton({ tall, className }: { tall: boolean; className?: string }) {
  return (
    <section className={cn("container-page mt-10 sm:mt-14", className)} aria-hidden="true">
      <div className="h-7 w-52 animate-pulse rounded bg-muted" />
      <div className={cn("mt-5 animate-pulse rounded-3xl bg-muted", tall ? "h-72" : "h-40")} />
    </section>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
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
