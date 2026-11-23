"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Check, Eye, Package, RotateCcw, Save, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAllStates } from "@/components/admin/geography-admin";
import { Field, PageHeader, Panel, Pill, STATUS_TONE, errorMessage, fieldErrors, humanize, useConfirm } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { CONDITION_LABELS, timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";

type AdminListing = {
  id: number; slug: string; title: string; description: string; condition: string; location: string; city: string | null;
  state: { id: number; name: string } | null; lga: { id: number; name: string } | null;
  brand: string | null; model: string | null; quantity: number | null; colour: string | null; dimensions: string | null; item_age: string | null;
  included_items: string | null; known_defects: string | null; handover_method: "hub_dropoff" | "dispatch_pickup" | null;
  giver_pickup_address: string | null; giver_pickup_phone: string | null; giver_pickup_times: string | null; fulfillment_notes: string | null;
  status: string; moderation_status: string; is_demo: boolean;
  category: { id: number; name: string } | null; giver: { id: number; name: string; slug: string; email?: string } | null;
  images: Array<{ id: number; url: string }> | null; image: string | null; requests_count: number; created_at: string; deleted_at: string | null;
};

const STATUSES = ["available", "reserved", "given_away", "paused", "removed"];
const STATUS_HINTS: Record<string, string> = {
  available: "Live and can be claimed",
  reserved: "Claimed — shown publicly as “Given away”",
  given_away: "Handover complete",
  paused: "Hidden from the marketplace",
  removed: "Removed for breaking the guidelines",
};

export function AdminEditListingPage({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["admin-listing", listingId],
    queryFn: () => api.get<{ data: AdminListing }>(`admin/listings/${listingId}`).then((r) => r.data),
  });
  const { data: categories } = useQuery({
    queryKey: ["admin-categories", "all"],
    queryFn: () => api.get<{ data: Array<{ id: number; name: string; is_active: boolean }> }>("admin/categories", { all: true }).then((r) => r.data),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-listing", listingId] });
    void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  async function moderate(outcome: "approved" | "rejected") {
    if (!listing) return;
    try {
      await api.patch(`moderation/listings/${listing.id}`, { moderation_status: outcome, note: null });
      toast.success(outcome === "approved" ? `"${listing.title}" is now live.` : `"${listing.title}" rejected — the giver was notified.`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update listing."));
    }
  }

  async function restore() {
    if (!listing) return;
    try {
      await api.post(`admin/listings/${listing.id}/restore`);
      toast.success("Listing restored");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not restore listing"));
    }
  }

  const back = <Button asChild variant="ghost" size="sm" className="-ml-2"><Link href="/admin/listings"><ArrowLeft className="size-4" /> All listings</Link></Button>;

  if (isLoading) {
    return <div className="max-w-6xl space-y-4"><div className="h-10 w-72 animate-pulse rounded bg-muted" /><div className="h-[600px] animate-pulse rounded-2xl bg-muted" /></div>;
  }
  if (error || !listing) {
    return (
      <div className="max-w-6xl">
        <PageHeader back={back} title="Listing not found" />
        <Panel><p className="text-sm text-muted-foreground">{errorMessage(error, `No listing exists with ID #${listingId}.`)}</p></Panel>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : listing.image ? [{ id: 0, url: listing.image }] : [];
  const isDeleted = !!listing.deleted_at;

  return (
    <div className="max-w-6xl">
      <PageHeader
        back={back}
        title={listing.title}
        description="Items are free — there is no price to set. Changes are visible on the marketplace straight away."
        actions={!isDeleted && <Button asChild variant="outline"><Link href={listingPath(listing.slug)} target="_blank"><Eye className="size-4" /> View on site</Link></Button>}
      />

      {listing.moderation_status === "pending" && !isDeleted && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-yellow-200 bg-highlight-soft px-5 py-4">
          <div>
            <p className="font-semibold text-highlight-soft-foreground">This listing is awaiting review</p>
            <p className="text-sm text-highlight-soft-foreground/80">Approve it to make it visible on the marketplace, or reject it.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void moderate("approved")}><Check className="size-4" /> Approve</Button>
            <Button size="sm" variant="outline" onClick={() => void moderate("rejected")}><X className="size-4" /> Reject</Button>
          </div>
        </div>
      )}

      {isDeleted && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4">
          <div>
            <p className="font-semibold text-destructive">This listing has been deleted</p>
            <p className="text-sm text-destructive/80">Restore it to edit it or put it back on the marketplace.</p>
          </div>
          {isAdmin && <Button size="sm" variant="outline" onClick={() => void restore()}><RotateCcw className="size-4" /> Restore</Button>}
        </div>
      )}

      <ListingEditForm
        key={`${listing.id}-${listing.deleted_at}`}
        listing={listing}
        categories={categories ?? []}
        isAdmin={isAdmin}
        isDeleted={isDeleted}
        images={images}
        onDelete={() => confirm({
          title: `Delete "${listing.title}"?`,
          description: "Open orders on it are closed and the listing disappears from the site. You can restore it later from the Deleted filter.",
          action: async () => {
            try {
              await api.delete(`admin/listings/${listing.id}`);
              toast.success("Listing deleted.");
              refresh();
              router.push("/admin/listings");
            } catch (err) {
              toast.error(errorMessage(err, "Could not delete listing."));
            }
          },
        })}
        onSaved={refresh}
      />
      {confirmDialog}
    </div>
  );
}

type FormState = Record<
  "title" | "description" | "category_id" | "condition" | "brand" | "model" | "quantity" | "colour" | "dimensions" | "item_age" | "included_items" |
  "known_defects" | "state_id" | "lga_id" | "location" | "city" | "handover_method" | "giver_pickup_address" | "giver_pickup_phone" |
  "giver_pickup_times" | "fulfillment_notes" | "status" | "moderation_status",
  string
>;

function ListingEditForm({ listing, categories, isAdmin, isDeleted, images, onDelete, onSaved }: {
  listing: AdminListing;
  categories: Array<{ id: number; name: string; is_active: boolean }>;
  isAdmin: boolean;
  isDeleted: boolean;
  images: Array<{ id: number; url: string }>;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(() => ({
    title: listing.title,
    description: listing.description,
    category_id: String(listing.category?.id ?? ""),
    condition: listing.condition,
    brand: listing.brand ?? "",
    model: listing.model ?? "",
    quantity: String(listing.quantity ?? 1),
    colour: listing.colour ?? "",
    dimensions: listing.dimensions ?? "",
    item_age: listing.item_age ?? "",
    included_items: listing.included_items ?? "",
    known_defects: listing.known_defects ?? "",
    state_id: listing.state ? String(listing.state.id) : "",
    lga_id: listing.lga ? String(listing.lga.id) : "",
    location: listing.location,
    city: listing.city ?? "",
    handover_method: listing.handover_method ?? "",
    giver_pickup_address: listing.giver_pickup_address ?? "",
    giver_pickup_phone: listing.giver_pickup_phone ?? "",
    giver_pickup_times: listing.giver_pickup_times ?? "",
    fulfillment_notes: listing.fulfillment_notes ?? "",
    status: listing.status,
    moderation_status: listing.moderation_status,
  }));

  const { data: states = [] } = useAllStates();
  const { data: lgas, isFetching: loadingLgas } = useQuery({
    queryKey: ["lgas", form.state_id],
    queryFn: () => api.get<{ data: Array<{ id: number; name: string }> }>(`states/${form.state_id}/lgas`).then((r) => r.data),
    enabled: !!form.state_id,
    staleTime: 10 * 60_000,
  });
  const selectedState = states.find((state) => String(state.id) === form.state_id);

  const set = (key: keyof FormState) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const readOnly = !isAdmin || isDeleted;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    const orNull = (value: string) => (value.trim() ? value.trim() : null);
    try {
      await api.put(`admin/listings/${listing.id}`, {
        title: form.title.trim(),
        description: form.description,
        category_id: Number(form.category_id),
        condition: form.condition,
        brand: orNull(form.brand), model: orNull(form.model), quantity: Number(form.quantity) || 1, colour: orNull(form.colour),
        dimensions: orNull(form.dimensions), item_age: orNull(form.item_age), included_items: orNull(form.included_items), known_defects: orNull(form.known_defects),
        state_id: form.state_id ? Number(form.state_id) : undefined,
        lga_id: form.lga_id ? Number(form.lga_id) : undefined,
        location: form.location.trim(), city: orNull(form.city),
        handover_method: form.handover_method || null,
        giver_pickup_address: orNull(form.giver_pickup_address), giver_pickup_phone: orNull(form.giver_pickup_phone), giver_pickup_times: orNull(form.giver_pickup_times),
        fulfillment_notes: orNull(form.fulfillment_notes),
        status: form.status,
        moderation_status: form.moderation_status,
      });
      toast.success("Listing saved.");
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save listing."));
    } finally {
      setBusy(false);
    }
  }

  const missingLocation = !form.state_id || !form.lga_id;

  return (
    <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <fieldset disabled={readOnly} className="min-w-0 space-y-6">
        <Panel title="Item">
          <div className="space-y-5">
            <Field label="Title" error={errors.title}><Input value={form.title} onChange={set("title")} required minLength={3} maxLength={120} aria-invalid={!!errors.title} /></Field>
            <Field label="Description" error={errors.description}>
              <RichTextEditor value={form.description} onChange={(html) => setForm((current) => ({ ...current, description: html }))} placeholder="Describe the item" invalid={!!errors.description} disabled={readOnly} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" error={errors.category_id}>
                <Select value={form.category_id} onChange={set("category_id")} required aria-invalid={!!errors.category_id}>
                  <option value="" disabled>Choose a category…</option>
                  {categories.map((item) => <option key={item.id} value={item.id}>{item.name}{item.is_active ? "" : " (hidden)"}</option>)}
                </Select>
              </Field>
              <Field label="Condition" error={errors.condition}>
                <Select value={form.condition} onChange={set("condition")}>
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        </Panel>

        <Panel title="Details" description="Optional facts that help receivers decide.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Brand" error={errors.brand}><Input value={form.brand} onChange={set("brand")} maxLength={80} /></Field>
            <Field label="Model" error={errors.model}><Input value={form.model} onChange={set("model")} maxLength={80} /></Field>
            <Field label="Quantity" error={errors.quantity}><Input type="number" min={1} max={500} value={form.quantity} onChange={set("quantity")} /></Field>
            <Field label="Colour" error={errors.colour}><Input value={form.colour} onChange={set("colour")} maxLength={40} /></Field>
            <Field label="Size / dimensions" error={errors.dimensions}><Input value={form.dimensions} onChange={set("dimensions")} maxLength={120} /></Field>
            <Field label="Age" error={errors.item_age}><Input value={form.item_age} onChange={set("item_age")} maxLength={60} placeholder="e.g. 2 years" /></Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="What's included" error={errors.included_items}><Textarea value={form.included_items} onChange={set("included_items")} rows={3} maxLength={1000} /></Field>
            <Field label="Known defects" hint={form.condition === "needs_repair" ? "Required for items that need repair." : undefined} error={errors.known_defects}><Textarea value={form.known_defects} onChange={set("known_defects")} rows={3} maxLength={2000} /></Field>
          </div>
        </Panel>

        <Panel title="Location" description="Area-level only — the item's state and Local Government Area power “near me” search.">
          {missingLocation && <p className="mb-4 rounded-lg bg-highlight-soft px-3 py-2 text-sm text-highlight-soft-foreground">This listing has no {form.state_id ? "LGA" : "state and LGA"} yet. Choose one so it shows up in “near me” results.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State" error={errors.state_id}>
              <Select value={form.state_id} onChange={(e) => setForm((current) => ({ ...current, state_id: e.target.value, lga_id: "" }))} required aria-invalid={!!errors.state_id}>
                <option value="" disabled>Choose a state…</option>
                {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </Select>
            </Field>
            <Field label="Local Government Area" error={errors.lga_id}>
              <Select value={form.lga_id} onChange={(e) => {
                const lga = lgas?.find((item) => String(item.id) === e.target.value);
                setForm((current) => ({ ...current, lga_id: e.target.value, city: current.city || lga?.name || "" }));
              }} required disabled={!form.state_id || loadingLgas || readOnly} aria-invalid={!!errors.lga_id}>
                <option value="" disabled>{!form.state_id ? "Choose a state first" : loadingLgas ? "Loading LGAs…" : `Choose an LGA in ${selectedState?.name ?? "the state"}…`}</option>
                {(lgas ?? []).map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </Select>
            </Field>
            <Field label="General area" hint="Neighbourhood shown publicly, e.g. Yaba." error={errors.location}><Input value={form.location} onChange={set("location")} required maxLength={120} /></Field>
            <Field label="City / town" error={errors.city}><Input value={form.city} onChange={set("city")} maxLength={120} placeholder="Defaults to the LGA" /></Field>
          </div>
        </Panel>

        <Panel title="Handover (staff only)" description="How the giver hands the item to Gratis Castle. Never shown to receivers.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Handover method" error={errors.handover_method}>
              <Select value={form.handover_method} onChange={set("handover_method")}>
                <option value="">Not set</option>
                <option value="hub_dropoff">Giver drops it at a hub</option>
                <option value="dispatch_pickup">Our dispatch collects it</option>
              </Select>
            </Field>
            <Field label="Giver's pickup phone" error={errors.giver_pickup_phone}><Input type="tel" value={form.giver_pickup_phone} onChange={set("giver_pickup_phone")} maxLength={32} /></Field>
            <Field label="Giver's pickup address" className="sm:col-span-2" error={errors.giver_pickup_address}><Textarea value={form.giver_pickup_address} onChange={set("giver_pickup_address")} rows={2} maxLength={500} /></Field>
            <Field label="Best collection times" error={errors.giver_pickup_times}><Input value={form.giver_pickup_times} onChange={set("giver_pickup_times")} maxLength={160} /></Field>
            <Field label="Notes for the team" error={errors.fulfillment_notes}><Input value={form.fulfillment_notes} onChange={set("fulfillment_notes")} maxLength={1000} /></Field>
          </div>
        </Panel>
      </fieldset>

      <div className="space-y-6">
        <Panel title="Status">
          <fieldset disabled={readOnly} className="space-y-4">
            <Field label="Listing status" hint={STATUS_HINTS[form.status]}>
              <Select value={form.status} onChange={set("status")}>
                {STATUSES.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
              </Select>
            </Field>
            <Field label="Review">
              <Select value={form.moderation_status} onChange={set("moderation_status")}>
                <option value="pending">Awaiting approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </Select>
            </Field>
          </fieldset>
          {isAdmin && !isDeleted && (
            <div className="mt-5 space-y-2 border-t border-border pt-5">
              <Button type="submit" className="w-full" disabled={busy}><Save className="size-4" /> {busy ? "Saving…" : "Save listing"}</Button>
              <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-4" /> Delete listing</Button>
            </div>
          )}
        </Panel>

        <Panel title="Photos">
          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                  <Image src={img.url} alt="" fill sizes="110px" className="object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl bg-muted px-4 py-8 text-center"><Package className="size-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No photos</p></div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Photos are managed by the giver from their listing.</p>
        </Panel>

        <Panel title="Info">
          <dl className="space-y-3 text-sm">
            <Row label="ID"><span className="font-mono text-xs">#{listing.id}</span></Row>
            <Row label="Status">{isDeleted ? <Pill tone="red">Deleted</Pill> : <Pill tone={STATUS_TONE[listing.status]}>{humanize(listing.status)}</Pill>}</Row>
            <Row label="Review"><Pill tone={STATUS_TONE[listing.moderation_status]}>{humanize(listing.moderation_status)}</Pill></Row>
            <Row label={<><Users className="size-3.5" /> Orders</>}><span className="font-semibold">{listing.requests_count}</span></Row>
            <Row label={<><CalendarDays className="size-3.5" /> Listed</>}>{timeAgo(listing.created_at)}</Row>
            {listing.giver && (
              <Row label="Giver">
                <span className="text-right">
                  <Link href={profilePath(listing.giver.slug)} target="_blank" className="font-semibold text-primary hover:underline">{listing.giver.name}</Link>
                  {listing.giver.email && <span className="block text-xs text-muted-foreground">{listing.giver.email}</span>}
                </span>
              </Row>
            )}
            {listing.is_demo && <Row label="Type"><Pill tone="blue">Demo</Pill></Row>}
          </dl>
        </Panel>
      </div>
    </form>
  );
}

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
