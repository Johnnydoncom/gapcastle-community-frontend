import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CircleAlert, MailCheck, PackageX, Pencil } from "lucide-react";
import { RequestCheckout } from "@/components/request/request-checkout";
import { Button } from "@/components/ui/button";
import { REQUEST_STATUS_LABELS } from "@/lib/gapcastle";
import { ServerApiError, getListing, getStates, getViewer } from "@/lib/server/api";
import { listingPath } from "@/lib/site";
import type { Listing, NgState } from "@/lib/types";

/**
 * The request "checkout" page. It checks on the server whether the member can
 * request this item (signed in, verified, not their own, still available) before
 * showing the form; the API enforces the same rules again on submit.
 */
export async function RequestCheckoutPage({ slug }: { slug: string }) {
  const checkoutPath = `${listingPath(slug)}/request`;
  const viewer = await getViewer();

  if (!viewer) {
    redirect(`/auth?next=${encodeURIComponent(checkoutPath)}`);
  }

  let listing: Listing;
  try {
    listing = (await getListing(slug)).data;
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) notFound();
    throw error;
  }

  const itemPath = listingPath(listing.slug || listing.id);
  const activeRequest = listing.viewer_request && listing.viewer_request.status !== "cancelled" ? listing.viewer_request : null;

  if (listing.is_owner) {
    return (
      <Blocked icon={Pencil} title="This is your listing" text="You can't request your own item — but you can manage it and review requests from others." itemPath={itemPath}>
        <Button asChild><Link href={`/account/listings?listing=${listing.id}`}>Manage listing</Link></Button>
      </Blocked>
    );
  }

  if (activeRequest) {
    return (
      <Blocked icon={CircleAlert} title={`You've already requested this item`} text={`Status: ${REQUEST_STATUS_LABELS[activeRequest.status]}. We'll notify you as soon as the giver responds.`} itemPath={itemPath}>
        <Button asChild><Link href="/account/requests">View my requests</Link></Button>
      </Blocked>
    );
  }

  if (!listing.is_requestable) {
    return (
      <Blocked icon={PackageX} title="This item is no longer available" text="Someone else may have been chosen, or the giver has paused it. There are plenty more good things to discover." itemPath={itemPath}>
        <Button asChild><Link href="/explore">Explore free items</Link></Button>
      </Blocked>
    );
  }

  if (!viewer.data.email_verified) {
    return (
      <Blocked icon={MailCheck} title="Please verify your email first" text="For everyone's safety, only verified members can request items. Check your inbox for the verification link, or resend it from your account." itemPath={itemPath}>
        <Button asChild><Link href="/account/settings">Account settings</Link></Button>
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
      defaultStateId={viewer.data.state?.id ?? null}
      defaultPhone={viewer.data.phone ?? ""}
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
