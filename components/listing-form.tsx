"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import { CONDITION_LABELS } from "@/lib/gapcastle";
import type { Category, HandoverMethod, Listing, NgState } from "@/lib/types";
import { MAX_ORIGINAL_BYTES, MAX_UPLOAD_BYTES, compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";

type Photo = { key: string; path?: string; url: string; progress: number; error?: string };
type Errors = Record<string, string | undefined>;

const MAX_PHOTOS = 8;
const PHONE_PATTERN = /^(\+?234|0)[789][01]\d{8}$/;
const CONDITION_HINTS: Record<string, string> = {
  brand_new: "Unused, possibly still in its packaging.",
  like_new: "Used a little, no visible wear.",
  good: "Used, works well, minor signs of wear.",
  fair: "Works, with noticeable wear or marks.",
  needs_repair: "Damaged but valuable — needs fixing to be useful.",
};
/** Fields a giver can still correct after the item has been claimed (mirrors the API). */
const EDITABLE_AFTER_CLAIM = ["title", "description", "brand", "model", "colour", "dimensions", "item_age", "included_items", "photos"];

function uploadPhoto(file: File, onProgress: (percent: number) => void): Promise<{ path: string; url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("photo", file);
    xhr.open("POST", "/api/backend/listing-photos");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let payload: { path?: string; url?: string; message?: string; errors?: Record<string, string[]> } = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        // Non-JSON error page.
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.path && payload.url) resolve({ path: payload.path, url: payload.url });
      else reject(new Error(payload.errors?.photo?.[0] ?? payload.message ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection"));
    xhr.send(form);
  });
}

/**
 * The give / edit listing form. Always a full page (never a popup): photos, the
 * basics, a rich-text description, item details, general location, and how the
 * giver hands the item to Gratis Castle. A live preview sits beside the form on
 * desktop and inline on phones.
 */
export function ListingForm({ initial, onSaved }: { initial?: Listing; onSaved: (listing: Listing, message: string) => void }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;
  const locked = !!initial?.is_locked;

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    category_id: initial?.category ? String(initial.category.id) : "",
    condition: initial?.condition ?? "good",
    quantity: String(initial?.details?.quantity ?? 1),
    description: initial?.description ?? "",
    brand: initial?.details?.brand ?? "",
    model: initial?.details?.model ?? "",
    colour: initial?.details?.colour ?? "",
    dimensions: initial?.details?.dimensions ?? "",
    item_age: initial?.details?.item_age ?? "",
    included_items: initial?.details?.included_items ?? "",
    known_defects: initial?.details?.known_defects ?? "",
    state_id: initial?.state?.id ? String(initial.state.id) : user?.state?.id ? String(user.state.id) : "",
    location: initial?.location ?? "",
    lga_id: initial?.lga?.id ? String(initial.lga.id) : user?.lga?.id && (!initial || initial.state?.id === user.state?.id) ? String(user.lga.id) : "",
    handover_method: (initial?.handover?.method ?? initial?.handover_method ?? "hub_dropoff") as HandoverMethod,
    giver_pickup_address: initial?.handover?.pickup_address ?? "",
    giver_pickup_phone: initial?.handover?.pickup_phone ?? user?.phone ?? "",
    giver_pickup_times: initial?.handover?.pickup_times ?? "",
    fulfillment_notes: initial?.fulfillment_notes ?? "",
  });
  const [descriptionText, setDescriptionText] = useState(initial?.description_text ?? "");
  const [freeConfirmed, setFreeConfirmed] = useState(isEdit);
  const [noTakeBack, setNoTakeBack] = useState(isEdit);
  const [photos, setPhotos] = useState<Photo[]>(
    (initial?.images ?? []).map((image) => ({ key: String(image.id), path: pathFromUrl(image.url), url: image.url, progress: 100 })),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("categories")).data,
  });
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: async () => (await api.get<{ data: NgState[] }>("states")).data,
    staleTime: 5 * 60_000,
  });

  const sortedStates = useMemo(
    () => [...(states ?? [])].sort((a, b) => Number(b.pickup_available) - Number(a.pickup_available) || a.name.localeCompare(b.name)),
    [states],
  );
  const { data: lgas, isFetching: loadingLgas } = useQuery({
    queryKey: ["lgas", form.state_id],
    queryFn: async () => (await api.get<{ data: { id: number; name: string }[] }>(`states/${form.state_id}/lgas`)).data,
    staleTime: 60 * 60_000,
    enabled: !!form.state_id,
  });

  const selectedState = states?.find((state) => String(state.id) === form.state_id) ?? null;
  const selectedLga = lgas?.find((lga) => String(lga.id) === form.lga_id) ?? null;
  const hubAvailable = !!selectedState?.pickup_available;
  const handover: HandoverMethod = hubAvailable ? form.handover_method : "dispatch_pickup";
  const uploading = photos.some((photo) => !photo.path && !photo.error);
  const categoryName = categories?.find((c) => String(c.id) === form.category_id)?.name;
  const isLockedField = (field: string) => locked && !EDITABLE_AFTER_CLAIM.includes(field);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function onPickPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_ORIGINAL_BYTES) {
        toast.error(`${file.name} is too large — please choose a smaller photo`);
        continue;
      }
      const key = crypto.randomUUID();
      setPhotos((prev) => [...prev, { key, url: URL.createObjectURL(file), progress: 0 }]);
      // Shrink in the browser first: faster for the giver, and under the hosting upload limit.
      compressImage(file)
        .then((small) => {
          if (small.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name} is too large — please choose a smaller photo`);
          return uploadPhoto(small, (progress) => setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, progress } : p))));
        })
        .then(({ path }) => setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, path, progress: 100 } : p))))
        .catch((error: Error) => {
          toast.error(error.message);
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, error: error.message } : p)));
        });
    }
    if (files.length > room) toast.info(`You can add up to ${MAX_PHOTOS} photos`);
    if (fileRef.current) fileRef.current.value = "";
    setErrors((current) => ({ ...current, photos: undefined }));
  }

  function removePhoto(photo: Photo) {
    setPhotos((prev) => prev.filter((p) => p.key !== photo.key));
    const isExisting = initial?.images?.some((image) => image.url === photo.url);
    if (photo.path && !isExisting) void api.delete(`listing-photos?path=${encodeURIComponent(photo.path)}`).catch(() => undefined);
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function validate(): Errors {
    const found: Errors = {};
    if (photos.filter((p) => p.path).length === 0) found.photos = "Add at least one clear photo of the item.";
    if (uploading) found.photos = "Please wait for your photos to finish uploading.";
    if (form.title.trim().length < 4) found.title = "Give the item a short, clear title (at least 4 characters).";
    if (!form.category_id) found.category_id = "Choose a category.";
    if (descriptionText.trim().length < 20) found.description = "Describe the item in a little more detail (at least 20 characters).";
    if (!(Number(form.quantity) >= 1)) found.quantity = "Quantity must be at least 1.";
    if (form.condition === "needs_repair" && form.known_defects.trim().length < 3) found.known_defects = "Describe what is damaged or needs repair.";
    if (!form.state_id) found.state_id = "Choose your state.";
    if (!form.lga_id) found.lga_id = "Choose your Local Government Area (LGA).";
    if (form.location.trim().length < 2) found.location = "Add your general area, e.g. Yaba.";
    if (handover === "dispatch_pickup") {
      if (form.giver_pickup_address.trim().length < 10) found.giver_pickup_address = "Add the address our dispatch rider should collect from.";
      if (!PHONE_PATTERN.test(form.giver_pickup_phone.replace(/[\s\-().]/g, ""))) found.giver_pickup_phone = "Enter a valid Nigerian mobile number, e.g. 0803 123 4567.";
    }
    if (!isEdit && !freeConfirmed) found.free_declaration = "Please confirm the item is free and described accurately.";
    if (!isEdit && !noTakeBack) found.no_take_back_declaration = "Please confirm you understand the item can't be taken back.";
    return found;
  }

  async function save() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      focusField(Object.keys(found)[0]);
      toast.error("Please check the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      const full: Record<string, unknown> = {
        title: form.title.trim(),
        category_id: Number(form.category_id),
        condition: form.condition,
        quantity: Number(form.quantity),
        description: form.description,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        colour: form.colour.trim() || null,
        dimensions: form.dimensions.trim() || null,
        item_age: form.item_age.trim() || null,
        included_items: form.included_items.trim() || null,
        known_defects: form.known_defects.trim() || null,
        state_id: Number(form.state_id),
        location: form.location.trim(),
        lga_id: Number(form.lga_id),
        handover_method: handover,
        giver_pickup_address: handover === "dispatch_pickup" ? form.giver_pickup_address.trim() : null,
        giver_pickup_phone: handover === "dispatch_pickup" ? form.giver_pickup_phone.trim() : null,
        giver_pickup_times: handover === "dispatch_pickup" ? form.giver_pickup_times.trim() || null : null,
        fulfillment_notes: form.fulfillment_notes.trim() || null,
        photos: photos.filter((p) => p.path).map((p) => p.path),
      };
      const payload = locked
        ? Object.fromEntries(Object.entries(full).filter(([key]) => EDITABLE_AFTER_CLAIM.includes(key)))
        : { ...full, ...(isEdit ? {} : { free_declaration: freeConfirmed, no_take_back_declaration: noTakeBack }) };

      const response = isEdit
        ? await api.patch<{ data: Listing; message: string }>(`listings/${initial!.id}`, payload)
        : await api.post<{ data: Listing; message: string }>("listings", payload);
      for (const key of ["explore", "home-listings", "my-listings", "listing-edit"]) void queryClient.invalidateQueries({ queryKey: [key] });
      onSaved(response.data, response.message);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        const serverErrors = Object.fromEntries(Object.entries(err.errors).map(([key, messages]) => [key.split(".")[0], messages[0]]));
        setErrors(serverErrors);
        focusField(Object.keys(serverErrors)[0]);
        toast.error("Please check the highlighted fields");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not save listing");
      }
    } finally {
      setSaving(false);
    }
  }

  const checklist = [
    { label: "Photos", done: photos.some((p) => p.path) },
    { label: "Title & category", done: form.title.trim().length >= 4 && !!form.category_id },
    { label: "Description", done: descriptionText.trim().length >= 20 },
    { label: "Location", done: !!form.state_id && !!form.lga_id && form.location.trim().length >= 2 },
    { label: "Handover", done: handover === "hub_dropoff" || (form.giver_pickup_address.trim().length >= 10 && form.giver_pickup_phone.trim().length >= 10) },
    ...(isEdit ? [] : [{ label: "Declarations", done: freeConfirmed && noTakeBack }]),
  ];
  const completed = checklist.filter((item) => item.done).length;
  const submitLabel = saving ? "Saving…" : isEdit ? "Save changes" : "Publish free listing";

  const preview = (
    <ListingPreview
      image={photos.find((p) => p.path || p.url)?.url}
      title={form.title}
      categoryName={categoryName}
      condition={form.condition}
      quantity={Number(form.quantity) || 1}
      description={descriptionText}
      place={[form.location, selectedLga?.name, selectedState?.name].filter(Boolean).join(", ")}
      details={[form.brand, form.model, form.colour, form.dimensions].filter(Boolean)}
    />
  );

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0">
      <div className="min-w-0 space-y-5">
        {!user?.email_verified && (
          <p className="rounded-2xl border border-border bg-accent/40 px-4 py-3 text-sm">
            Please verify <strong>{user?.email}</strong> before publishing.{" "}
            <Link href="/verify-email?next=%2Fgive" className="font-semibold text-primary hover:underline">Verify with a code</Link>
          </p>
        )}

        {locked && (
          <div className="flex gap-3 rounded-2xl border border-brand-yellow-300 bg-highlight-soft p-4 text-sm text-highlight-soft-foreground">
            <Lock className="mt-0.5 size-5 shrink-0" />
            <p><strong>This item has been claimed.</strong> Items given on Gratis Castle can&apos;t be taken back, so you can only correct the title, description, details and photos now.</p>
          </div>
        )}

        {showPreview && <div className="lg:hidden">{preview}</div>}

        <Section number={1} icon={ImagePlus} title="Photos" hint={`Up to ${MAX_PHOTOS}. The first photo is the cover — use the arrows to reorder.`} error={errors.photos} id="field-photos">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((p, index) => (
              <div key={p.key} className={cn("group relative aspect-square overflow-hidden rounded-xl border bg-muted", index === 0 ? "border-primary ring-2 ring-primary/20" : "border-border")}>
                <Image src={p.url} alt="" fill unoptimized sizes="160px" className="object-cover" />
                {index === 0 && <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground"><Star className="size-3" /> Cover</span>}
                {!p.path && !p.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/45 text-[11px] font-semibold text-background">
                    <Loader2 className="size-4 animate-spin" /> {p.progress}%
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-background/30"><div className="h-full bg-highlight transition-all" style={{ width: `${p.progress}%` }} /></div>
                  </div>
                )}
                {p.error && <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-[11px] font-semibold text-destructive-foreground">Failed</div>}
                <button type="button" onClick={() => removePhoto(p)} className="absolute right-1.5 top-1.5 rounded-full bg-card/95 p-1 shadow-soft" aria-label="Remove photo"><X className="size-3.5" /></button>
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0} className="rounded-full bg-card/95 p-1 shadow-soft disabled:opacity-0" aria-label="Move photo earlier"><ArrowLeft className="size-3.5" /></button>
                  <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} className="rounded-full bg-card/95 p-1 shadow-soft disabled:opacity-0" aria-label="Move photo later"><ArrowRight className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:bg-primary-50/40 hover:text-primary">
                <ImagePlus className="size-6" />
                <span className="text-xs font-semibold">Add photos</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onPickPhotos(e.target.files)} />
          <p className="mt-3 text-xs text-muted-foreground">JPG, PNG or WebP, max 5 MB each. Show the whole item in good light, plus close-ups of any marks or damage.</p>
        </Section>

        <Section number={2} icon={Package} title="The basics">
          <div className="space-y-4">
            <Field id="title" label="Item title" error={errors.title} hint={`${form.title.length}/120`}>
              <Input id="field-title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="e.g. Solid wood study desk with drawer" aria-invalid={!!errors.title} className="h-11" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_120px]">
              <Field id="category_id" label="Category" error={errors.category_id}>
                <Select id="field-category_id" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} disabled={isLockedField("category_id")} aria-invalid={!!errors.category_id} className="h-11">
                  <option value="">Choose a category…</option>
                  {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field id="condition" label="Condition" error={errors.condition}>
                <Select id="field-condition" value={form.condition} onChange={(e) => set("condition", e.target.value as typeof form.condition)} disabled={isLockedField("condition")} className="h-11">
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <Field id="quantity" label="Quantity" error={errors.quantity}>
                <Input id="field-quantity" type="number" inputMode="numeric" min={1} max={500} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} disabled={isLockedField("quantity")} className="h-11" />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">{CONDITION_HINTS[form.condition]}</p>
          </div>
        </Section>

        <Section number={3} icon={Info} title="Description" hint="Be honest and specific — it builds trust and avoids disappointment." error={errors.description} id="field-description">
          <RichTextEditor
            value={form.description}
            onChange={(html, text) => { set("description", html); setDescriptionText(text); }}
            placeholder="What is it, how old is it, how well does it work, and why are you giving it away?"
            invalid={!!errors.description}
          />
        </Section>

        <Section number={4} icon={Store} title="Item details" hint="Optional, but the more you share, the better the match.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="brand" label="Brand" optional><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} maxLength={80} placeholder="e.g. Samsung" /></Field>
            <Field id="model" label="Model" optional><Input value={form.model} onChange={(e) => set("model", e.target.value)} maxLength={80} placeholder="e.g. Galaxy A12" /></Field>
            <Field id="colour" label="Colour" optional><Input value={form.colour} onChange={(e) => set("colour", e.target.value)} maxLength={40} placeholder="e.g. Black" /></Field>
            <Field id="dimensions" label="Size / dimensions" optional><Input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} maxLength={120} placeholder="e.g. 120 × 60 × 75 cm, or size 42" /></Field>
            <Field id="item_age" label="Approximate age" optional><Input value={form.item_age} onChange={(e) => set("item_age", e.target.value)} maxLength={60} placeholder="e.g. About 2 years" /></Field>
            <Field id="included_items" label="What's included" optional><Input value={form.included_items} onChange={(e) => set("included_items", e.target.value)} maxLength={1000} placeholder="e.g. Charger and original box" /></Field>
            <Field
              id="known_defects"
              label={form.condition === "needs_repair" ? "What's damaged or needs repair" : "Known faults or damage"}
              optional={form.condition !== "needs_repair"}
              error={errors.known_defects}
              className="sm:col-span-2"
            >
              <Textarea id="field-known_defects" value={form.known_defects} onChange={(e) => set("known_defects", e.target.value)} disabled={isLockedField("known_defects")} maxLength={2000} rows={3} placeholder="e.g. Screen has a crack in the corner; battery lasts about 2 hours." aria-invalid={!!errors.known_defects} />
            </Field>
          </div>
        </Section>

        <Section number={5} icon={MapPin} title="General location" hint="Shown publicly as an area only — never your address.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="state_id" label="State" error={errors.state_id}>
              <Select id="field-state_id" value={form.state_id} onChange={(e) => { set("state_id", e.target.value); set("lga_id", ""); }} disabled={isLockedField("state_id")} aria-invalid={!!errors.state_id} className="h-11">
                <option value="">Choose your state…</option>
                <optgroup label="With a Gratis Castle hub">
                  {sortedStates.filter((s) => s.pickup_available).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
                <optgroup label="Other states">
                  {sortedStates.filter((s) => !s.pickup_available).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              </Select>
            </Field>
            <Field id="lga_id" label="LGA" error={errors.lga_id}>
              <Select id="field-lga_id" value={form.lga_id} onChange={(e) => set("lga_id", e.target.value)} disabled={!form.state_id || loadingLgas || isLockedField("lga_id")} aria-invalid={!!errors.lga_id} className="h-11">
                <option value="">{!form.state_id ? "Choose a state first" : loadingLgas ? "Loading…" : "Choose your LGA…"}</option>
                {(lgas ?? []).map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </Select>
            </Field>
            <Field id="location" label="Area / neighbourhood" error={errors.location}>
              <Input id="field-location" value={form.location} onChange={(e) => set("location", e.target.value)} disabled={isLockedField("location")} maxLength={120} placeholder="e.g. Yaba" aria-invalid={!!errors.location} className="h-11" />
            </Field>
          </div>
        </Section>

        <Section number={6} icon={ShieldCheck} title="How you'll hand it over" hint="You never meet the receiver. Gratis Castle takes it from here — free of charge." error={errors.handover_method} id="field-handover_method">
          <div role="radiogroup" aria-label="Handover method" className="grid gap-3 sm:grid-cols-2">
            <ChoiceCard
              selected={handover === "hub_dropoff"}
              disabled={!hubAvailable || isLockedField("handover_method")}
              onSelect={() => set("handover_method", "hub_dropoff")}
              icon={Store}
              title="I'll drop it at the Gratis Castle hub"
              text={hubAvailable ? `Bring it to our ${selectedState?.name} hub once it's claimed.` : selectedState ? `There's no hub in ${selectedState.name} yet.` : "Choose your state first."}
            />
            <ChoiceCard
              selected={handover === "dispatch_pickup"}
              disabled={isLockedField("handover_method")}
              onSelect={() => set("handover_method", "dispatch_pickup")}
              icon={Bike}
              title="Dispatch should pick it up from me"
              text="Our dispatch rider collects it from you once it's claimed."
            />
          </div>

          {handover === "dispatch_pickup" && (
            <div className="mt-4 space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
              <p className="flex items-start gap-2 text-xs text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0 text-success" /> Private — only Gratis Castle staff see these details. They are never shown to members.</p>
              <Field id="giver_pickup_address" label="Pickup address" error={errors.giver_pickup_address}>
                <Textarea id="field-giver_pickup_address" value={form.giver_pickup_address} onChange={(e) => set("giver_pickup_address", e.target.value)} disabled={isLockedField("giver_pickup_address")} rows={2} maxLength={500} placeholder="House number, street, area and a nearby landmark" aria-invalid={!!errors.giver_pickup_address} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="giver_pickup_phone" label="Phone for the rider" error={errors.giver_pickup_phone}>
                  <Input id="field-giver_pickup_phone" type="tel" inputMode="tel" value={form.giver_pickup_phone} onChange={(e) => set("giver_pickup_phone", e.target.value)} disabled={isLockedField("giver_pickup_phone")} placeholder="0803 123 4567" aria-invalid={!!errors.giver_pickup_phone} />
                </Field>
                <Field id="giver_pickup_times" label="Best times to collect" optional>
                  <Input value={form.giver_pickup_times} onChange={(e) => set("giver_pickup_times", e.target.value)} disabled={isLockedField("giver_pickup_times")} maxLength={160} placeholder="e.g. Weekdays after 5pm" />
                </Field>
              </div>
            </div>
          )}
        </Section>

        <Section number={7} icon={Info} title="Notes for the Gratis Castle team" hint="Optional — anything that helps with handling, e.g. very heavy or fragile.">
          <Input value={form.fulfillment_notes} onChange={(e) => set("fulfillment_notes", e.target.value)} disabled={isLockedField("fulfillment_notes")} maxLength={1000} placeholder="e.g. Heavy — needs two people to carry." />
        </Section>

        {!isEdit && (
          <Section number={8} icon={Check} title="Before you publish">
            <div className="space-y-3">
              <Declaration id="field-free_declaration" checked={freeConfirmed} onChange={(value) => { setFreeConfirmed(value); setErrors((e) => ({ ...e, free_declaration: undefined })); }} error={errors.free_declaration}>
                I confirm this item is offered <strong className="text-foreground">for free</strong> and the description and photos honestly show its condition.
              </Declaration>
              <Declaration id="field-no_take_back_declaration" checked={noTakeBack} onChange={(value) => { setNoTakeBack(value); setErrors((e) => ({ ...e, no_take_back_declaration: undefined })); }} error={errors.no_take_back_declaration}>
                I understand that once listed, <strong className="text-foreground">the item cannot be taken back</strong> — the first member to check out gets it, with no approval step.
              </Declaration>
            </div>
          </Section>
        )}

        <div className="hidden gap-3 sm:flex lg:hidden">
          <Button type="button" size="lg" variant="outline" className="flex-1" onClick={() => setShowPreview((v) => !v)}>{showPreview ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {showPreview ? "Hide preview" : "Preview"}</Button>
          <Button type="button" size="lg" className="flex-1" disabled={saving || !user?.email_verified} onClick={save}>{saving && <Loader2 className="size-4 animate-spin" />} {submitLabel}</Button>
        </div>
      </div>

      {/* Desktop sidebar: live preview, progress and the publish button. */}
      <aside className="hidden lg:sticky lg:top-36 lg:block">
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</p>
          {preview}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Listing progress</span>
              <span className="text-muted-foreground">{completed}/{checklist.length}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-success transition-all" style={{ width: `${(completed / checklist.length) * 100}%` }} /></div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {checklist.map((item) => (
                <li key={item.label} className={cn("flex items-center gap-2", item.done ? "text-foreground" : "text-muted-foreground")}>
                  <span className={cn("flex size-4 items-center justify-center rounded-full", item.done ? "bg-success text-white" : "border border-border")}>{item.done && <Check className="size-3" strokeWidth={3} />}</span>
                  {item.label}
                </li>
              ))}
            </ul>
            <Button type="button" size="lg" className="mt-4 w-full" disabled={saving || !user?.email_verified} onClick={save}>
              {saving && <Loader2 className="size-4 animate-spin" />} {submitLabel}
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">100% free · No prices · Free delivery to the receiver</p>
          </div>
        </div>
      </aside>

      {/* Phone: sticky action bar. */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur sm:hidden">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Button type="button" variant="outline" size="lg" className="h-12 rounded-xl px-4" onClick={() => { setShowPreview((v) => !v); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={showPreview ? "Hide preview" : "Show preview"}>
            {showPreview ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </Button>
          <Button type="button" size="lg" className="h-12 flex-1 rounded-xl text-base" disabled={saving || !user?.email_verified} onClick={save}>
            {saving && <Loader2 className="size-5 animate-spin" />} {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function focusField(key: string) {
  const element = document.getElementById(`field-${key}`);
  element?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) element.focus({ preventScroll: true });
}

function Section({ number, icon: Icon, title, hint, error, id, children }: { number: number; icon: LucideIcon; title: string; hint?: string; error?: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-32 rounded-3xl border bg-card p-4 shadow-soft sm:p-6", error ? "border-destructive/60" : "border-border")}>
      <header className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-[18px]" /></span>
        <div className="min-w-0">
          <h2 className="text-base font-bold sm:text-lg"><span className="mr-1.5 text-muted-foreground">{number}.</span>{title}</h2>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{hint}</p>}
        </div>
      </header>
      {children}
      {error && <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive"><AlertTriangle className="size-3.5" /> {error}</p>}
    </section>
  );
}

function Field({ id, label, optional = false, error, hint, className, children }: { id: string; label: string; optional?: boolean; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={`field-${id}`}>{label}{optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}</Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ChoiceCard({ selected, disabled, onSelect, icon: Icon, title, text }: { selected: boolean; disabled: boolean; onSelect: () => void; icon: LucideIcon; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-[border-color,background-color,transform] active:scale-[0.98]",
        selected ? "border-primary bg-primary-50/60" : "border-border hover:border-primary-200",
        disabled && "cursor-not-allowed border-dashed opacity-60 hover:border-border active:scale-100",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

function Declaration({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (value: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div id={id}>
      <label className={cn("flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors", checked ? "border-success/40 bg-success-soft/40" : error ? "border-destructive/60" : "border-border")}>
        <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5" />
        <span className="text-muted-foreground">{children}</span>
      </label>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function ListingPreview({ image, title, categoryName, condition, quantity, description, place, details }: {
  image?: string; title: string; categoryName?: string; condition: string; quantity: number; description: string; place: string; details: string[];
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="relative aspect-[4/3] bg-muted">
        {image ? <Image src={image} alt="" fill unoptimized sizes="340px" className="object-cover" /> : <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-secondary to-accent/40 text-muted-foreground"><ImagePlus className="size-8" /><span className="text-xs">Your cover photo</span></div>}
        <span className="absolute left-3 top-3 rounded bg-highlight px-2 py-0.5 text-[11px] font-extrabold tracking-wider text-highlight-foreground shadow-soft">FREE</span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs font-semibold text-primary">{categoryName ?? "Category"}</p>
        <h3 className="line-clamp-2 font-bold leading-snug">{title || "Your item title"}</h3>
        <p className="text-xs text-muted-foreground">
          {CONDITION_LABELS[condition]}{quantity > 1 && ` · Qty ${quantity}`}
          <span className="mx-1.5 text-border">•</span>Hub pickup or free delivery
        </p>
        {details.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {details.slice(0, 4).map((detail) => <span key={detail} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{detail}</span>)}
          </div>
        )}
        <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{description || "Your description will appear here."}</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3.5" /> {place || "Your area"}</p>
      </div>
    </div>
  );
}

/** Existing photo URLs map back to their storage path (or stay as remote URLs for demo images). */
function pathFromUrl(url: string): string {
  const marker = "/storage/";
  const index = url.indexOf(marker);
  return index >= 0 ? url.slice(index + marker.length) : url;
}
