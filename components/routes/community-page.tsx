import Link from "next/link";
import { HandHeart, Leaf, MessageCircle, ShieldCheck } from "lucide-react";
import { ImpactStats } from "@/components/home/impact-stats";
import { Button } from "@/components/ui/button";
import { getStats } from "@/lib/server/api";
import type { CommunityStats } from "@/lib/types";

const VALUES = [
  { icon: HandHeart, title: "Always free", text: "Nothing on Gratis Castle is sold. Delivery costs, if any, are agreed openly and kept separate from the item." },
  { icon: ShieldCheck, title: "Safe and private", text: "Only general areas are public, verified members are marked, and moderators review every report." },
  { icon: Leaf, title: "Less waste", text: "Every item that finds a second home is one less thing thrown away." },
  { icon: MessageCircle, title: "Real connections", text: "Givers choose who receives, and every handoff starts with a friendly conversation." },
];

const EMPTY_STATS: CommunityStats = { items_shared: 0, items_rehomed: 0, members: 0, communities: 0 };

/** Skeleton shown while community stats stream in. */
export function CommunitySkeleton() {
  return (
    <div>
      <div className="h-80 animate-pulse bg-foreground/95" />
      <div className="container-page py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export async function CommunityPage() {
  const stats = await getStats().then((response) => response.data).catch(() => EMPTY_STATS);

  return (
    <div>
      <section className="bg-foreground text-background">
        <div className="container-page py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-highlight">Our community</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Small Acts of Giving. Big Community Impact.</h1>
          <p className="mt-4 max-w-2xl text-lg text-background/80">Gratis Castle is made of neighbours who give freely, receive gratefully and look out for one another.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="highlight"><Link href="/auth?mode=join">Join the Community</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"><Link href="/give">Give something away</Link></Button>
          </div>
        </div>
      </section>
      <div className="py-10"><ImpactStats stats={stats} /></div>
      <section className="container-page pb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground"><value.icon className="size-5" /></span>
              <h2 className="mt-4 font-bold">{value.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream p-8">
          <div>
            <h2 className="text-xl font-bold">How we look after each other</h2>
            <p className="mt-1 text-muted-foreground">Read the guidelines every member agrees to, and our tips for safe handoffs.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href="/community-guidelines">Community guidelines</Link></Button>
            <Button asChild variant="outline"><Link href="/safety">Safety guidelines</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
