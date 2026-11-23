import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, MailCheck, PackageCheck, PackageX, Pencil, Receipt } from "lucide-react";
import { RequestCheckout } from "@/components/request/request-checkout";
import { Button } from "@/components/ui/button";
import { ServerApiError, getListing, getStates, getViewer } from "@/lib/server/api";
import { listingPath } from "@/lib/site";
import type { Listing, NgState } from "@/lib/types";

/**
 * The free checkout page. It checks on the server whether the member can get
 * this item (signed in, verified, not their own, still available, within the
 * monthly limit) before showing the form; the API enforces the same rules again.
 */
export async function RequestCheckoutPage({ slug }: { slug: string }) {
  const checkoutPath = `${listingPath(slug)}/request`;
  const viewer = await getViewer();

  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(checkoutPath)}`);
  }

  let listing: Listing;
  try {
    listing = (await getListing(slug)).data;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) notFound();
    throw error;
  }

  const itemPath = listingPath(listing.slug || listing.id);
  const myOrder = listing.viewer_request && ["accepted", "completed"].includes(listing.viewer_request.status) ? listing.viewer_request : null;
  const account = viewer.data;

  if (listing.is_owner) {
    return (
      <Blocked icon={Pencil} title="This is your listing" text="You can't get your own item — but you can manage it and follow its handover." itemPath={itemPath}>
        <Button asChild><Link href={`/account/listings?listing=${listing.id}`}>Manage listing</Link></Button>
      </Blocked>
    );
  }

  if (myOrder) {
    return (
      <Blocked icon={Receipt} title="This item is already yours" text="You've placed an order for this item. Track it and confirm when you receive it in your orders." itemPath={itemPath}>
        <Button asChild><Link href={`/account/requests?order=${myOrder.id}`}>View my order</Link></Button>
      </Blocked>
    );
  }

  if (!listing.is_requestable) {
    const gone = listing.status === "reserved" || listing.status === "given_away";
    return (
      <Blocked icon={gone ? PackageCheck : PackageX} title={gone ? "This item has been given away" : "This item is not available"} text={gone ? "Someone checked it out first. There are plenty more free items to discover." : "The giver has paused it or it's waiting for review. There are plenty more good things to discover."} itemPath={itemPath}>
        <Button asChild><Link href="/explore">Explore free items</Link></Button>
      </Blocked>
    );
  }

  if (!viewer.data.email_verified) {
    return (
      <Blocked icon={MailCheck} title="Please verify your email first" text="For everyone's safety, only verified members can get items. Confirm your email with the 6-digit code we send you — it only takes a moment." itemPath={itemPath}>
        <Button asChild><Link href={`/verify-email?next=${encodeURIComponent(`${itemPath}/request`)}`}>Verify my email</Link></Button>
      </Blocked>
    );
  }

  if (account.claims.this_month >= account.claims.monthly_limit) {
    return (
      <Blocked icon={CalendarClock} title="You've reached this month's limit" text={`To keep things fair, each member can get up to ${account.claims.monthly_limit} free items a month. You can get more from the 1st of next month — save this item in the meantime.`} itemPath={itemPath}>
        <Button asChild><Link href="/account/requests">View my orders</Link></Button>
      </Blocked>
    );
  }

  const states = await getStates().then((response) => response.data).catch((): NgState[] => []);

  return (
    <RequestCheckout
      listing={{
        id: listing.id,
        title: listing.title,
        path: itemPath,
        image: listing.images?.[0]?.url ?? null,
        place: [listing.location, listing.city].filter(Boolean).join(", "),
        condition: listing.condition_label,
        giverName: listing.giver?.name ?? "the giver",
      }}
      states={states}
      defaults={{
        name: [account.first_name, account.last_name].filter(Boolean).join(" ") || account.name,
        email: account.email,
        phone: account.phone ?? "",
        stateId: account.state?.id ?? null,
        safetyAcknowledged: account.safety_acknowledged,
        claimsThisMonth: account.claims.this_month,
        monthlyLimit: account.claims.monthly_limit,
      }}
    />
  );
}

function Blocked({ icon: Icon, title, text, itemPath, children }: { icon: typeof Pencil; title: string; text: string; itemPath: string; children: React.ReactNode }) {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-7" /></span>
        <h1 className="mt-4 text-xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        <div className="mt-6 flex flex-col gap-2">
          {children}
          <Button asChild variant="ghost"><Link href={itemPath}><ArrowLeft className="size-4" /> Back to item</Link></Button>
        </div>
      </div>
    </div>
  );
}

export function RequestCheckoutSkeleton() {
  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-hidden="true">
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-3xl bg-muted" />)}
      </div>
      <div className="hidden h-80 animate-pulse rounded-3xl bg-muted lg:block" />
    </div>
  );
}
