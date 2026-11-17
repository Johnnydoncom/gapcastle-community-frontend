import Link from "next/link";
import { Clock, MapPin, Navigation, Phone, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStates } from "@/lib/server/api";
import type { NgState, PickupLocation } from "@/lib/types";

/** Public directory of Gratis Castle pickup hubs, grouped by state. Data is managed in Admin › Pickup locations. */
export async function PickupHubsPage() {
  const states = await getStates().then((response) => response.data).catch((): NgState[] => []);
  const withHubs = states.filter((state) => state.pickup_available);
  const others = states.filter((state) => !state.pickup_available);

  return (
    <div className="container-page py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-3xl bg-primary-700 p-6 text-white sm:p-10">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand-yellow-400/20 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-wider text-brand-yellow-300">Collect it yourself</p>
        <h1 className="relative mt-2 text-2xl font-extrabold sm:text-4xl">Gratis Castle pickup hubs</h1>
        <p className="relative mt-3 max-w-xl text-sm text-primary-100 sm:text-base">
          When you request an item, choose a hub in your state and collect it there for free. No hub in your state yet? Choose waybill delivery instead — the item stays free.
        </p>
        {withHubs.length > 0 && (
          <nav aria-label="Jump to state" className="relative mt-5 flex flex-wrap gap-2">
            {withHubs.map((state) => (
              <a key={state.id} href={`#${state.slug}`} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20 transition-colors hover:bg-white/20">{state.name}</a>
            ))}
          </nav>
        )}
      </header>

      {withHubs.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">Pickup hubs are opening soon.</p>
          <p className="mt-1 text-sm text-muted-foreground">You can still request any item and receive it by waybill.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {withHubs.map((state) => (
            <section key={state.id} id={state.slug} className="scroll-mt-32" aria-labelledby={`${state.slug}-title`}>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><MapPin className="size-5" /></span>
                <div>
                  <h2 id={`${state.slug}-title`} className="text-xl font-extrabold">{state.name}</h2>
                  <p className="text-sm text-muted-foreground">{state.pickup_locations.length} hub{state.pickup_locations.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.pickup_locations.map((hub) => <HubCard key={hub.id} hub={hub} stateName={state.name} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <section className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-8" aria-labelledby="waybill-title">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight-soft text-highlight-soft-foreground"><Truck className="size-5" /></span>
            <div>
              <h2 id="waybill-title" className="text-lg font-extrabold">Everywhere else: waybill delivery</h2>
              <p className="mt-1 text-sm text-muted-foreground">In these states, choose waybill when you request. Any waybill cost is agreed openly and paid separately — never for the item.</p>
            </div>
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            {others.map((state) => <li key={state.id} className="rounded-full bg-muted px-3 py-1 text-sm">{state.name}</li>)}
          </ul>
          <Button asChild className="mt-6"><Link href="/explore">Find something free</Link></Button>
        </section>
      )}
    </div>
  );
}

function HubCard({ hub, stateName }: { hub: PickupLocation; stateName: string }) {
  const mapQuery = hub.latitude && hub.longitude ? `${hub.latitude},${hub.longitude}` : `${hub.name}, ${hub.address}, ${hub.area}, ${stateName}, Nigeria`;
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-5">
      <h3 className="font-bold">{hub.name}</h3>
      <p className="text-sm font-medium text-primary">{hub.area}</p>
      <p className="mt-2 text-sm text-muted-foreground">{hub.address}</p>
      {hub.landmark && <p className="text-xs text-muted-foreground">Landmark: {hub.landmark}</p>}
      <div className="mt-3 space-y-1 text-sm">
        {hub.opening_hours && <p className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" /> {hub.opening_hours}</p>}
        {hub.phone && <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> <a href={`tel:${hub.phone.replace(/\s/g, "")}`} className="hover:text-primary">{hub.phone}</a></p>}
      </div>
      {hub.notes && <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{hub.notes}</p>}
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 self-start rounded-lg px-1 text-sm font-semibold text-primary hover:underline">
        <Navigation className="size-4" /> Get directions
      </a>
    </article>
  );
}

export function PickupHubsSkeleton() {
  return (
    <div className="container-page space-y-6 py-10" aria-hidden="true">
      <div className="h-52 animate-pulse rounded-3xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-3xl bg-muted" />)}
      </div>
    </div>
  );
}
