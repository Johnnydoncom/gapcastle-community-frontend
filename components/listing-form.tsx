"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ImagePlus, Loader2, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import { CONDITION_LABELS } from "@/lib/gapcastle";
import type { Category, Listing } from "@/lib/types";

type Photo = { key: string; path?: string; url: string; progress: number; error?: string };

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const CONDITIONS = Object.entries(CONDITION_LABELS).filter(([value]) => ["brand_new", "like_new", "good", "fair"].includes(value));

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
 * The give/edit form, based on gapcastle-lovable/src/routes/give.tsx with upload progress,
 * the Gap Castle handover explainer and a preview step.
 */
export function ListingForm({ initial, onSaved }: { initial?: Listing; onSaved: (listing: Listing, message: string) => void }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category ? String(initial.category.id) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [condition, setCondition] = useState<string>(initial?.condition ?? "good");
  const [location, setLocation] = useState(initial ? [initial.location, initial.city].filter(Boolean).join(", ") : (user?.location ?? ""));
  const [notes, setNotes] = useState(initial?.fulfillment_notes ?? "");
  const [confirmed, setConfirmed] = useState(isEdit);
  const [photos, setPhotos] = useState<Photo[]>(
    (initial?.images ?? []).map((image) => ({ key: String(image.id), path: pathFromUrl(image.url), url: image.url, progress: 100 })),
  );
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("categories")).data,
  });

  const uploading = photos.some((photo) => !photo.path && !photo.error);

  function onPickPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 5 MB`);
        continue;
      }
      const key = crypto.randomUUID();
      setPhotos((prev) => [...prev, { key, url: URL.createObjectURL(file), progress: 0 }]);
      uploadPhoto(file, (progress) => setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, progress } : p))))
        .then(({ path }) => setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, path, progress: 100 } : p))))
        .catch((error: Error) => {
          toast.error(error.message);
          setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, error: error.message } : p)));
        });
    }
    if (files.length > room) toast.info(`You can add up to ${MAX_PHOTOS} photos`);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePhoto(photo: Photo) {
    setPhotos((prev) => prev.filter((p) => p.key !== photo.key));
    const isExisting = initial?.images?.some((image) => image.url === photo.url);
    if (photo.path && !isExisting) void api.delete(`listing-photos?path=${encodeURIComponent(photo.path)}`).catch(() => undefined);
  }

  async function save() {
    setSaving(true);
    try {
      const [area, ...rest] = location.split(",");
      const payload = {
        title,
        category_id: categoryId ? Number(categoryId) : null,
        description,
        condition,
        location: area.trim(),
        city: rest.join(",").trim() || null,
        fulfillment_notes: notes || null,
        photos: photos.filter((p) => p.path).map((p) => p.path),
        ...(isEdit ? {} : { free_declaration: confirmed }),
      };
      const response = isEdit
        ? await api.patch<{ data: Listing; message: string }>(`listings/${initial!.id}`, payload)
        : await api.post<{ data: Listing; message: string }>("listings", payload);
      void queryClient.invalidateQueries({ queryKey: ["explore"] });
      void queryClient.invalidateQueries({ queryKey: ["home-listings"] });
      void queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      setPreviewOpen(false);
      onSaved(response.data, response.message);
    } catch (err) {
      const fieldError = err instanceof ApiError ? Object.values(err.errors)[0]?.[0] : undefined;
      toast.error(fieldError ?? (err instanceof Error ? err.message : "Could not save listing"));
    } finally {
      setSaving(false);
    }
  }

  const valid = title.trim().length >= 4 && description.trim().length >= 10 && location.trim().length >= 2 && confirmed && !uploading;
  const canPublish = valid && !!user?.email_verified;
  const categoryName = categories?.find((c) => String(c.id) === categoryId)?.name;
  const previewImage = photos.find((p) => p.path)?.url;

  return (
    <>
      {!user?.email_verified && (
        <p className="mb-6 rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm">
          Please verify your email before publishing — use the link we sent to <strong>{user?.email}</strong>.
        </p>
      )}
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="space-y-1.5">
          <Label htmlFor="g-title">Item title</Label>
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Gently used study desk" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="g-category">Category</Label>
            <Select id="g-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Choose a category</option>
              {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-condition">Condition</Label>
            <Select id="g-condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
              {CONDITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="g-desc">Describe the item honestly</Label>
          <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} placeholder="What is it, how old, any marks or quirks, why you're giving it away…" />
        </div>

        <div className="space-y-2">
          <Label>Photos</Label>
          <div className="flex flex-wrap gap-3">
            {photos.map((p) => (
              <div key={p.key} className="relative size-24 overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                <img src={p.url} alt="" className="size-full object-cover" />
                {!p.path && !p.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-foreground/45 text-[11px] font-semibold text-background">
                    <Loader2 className="size-4 animate-spin" /> {p.progress}%
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-background/30"><div className="h-full bg-highlight transition-all" style={{ width: `${p.progress}%` }} /></div>
                  </div>
                )}
                {p.error && <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-[11px] font-semibold text-destructive-foreground">Failed</div>}
                <button type="button" onClick={() => removePhoto(p)} className="absolute right-1 top-1 rounded-full bg-card/90 p-1" aria-label="Remove photo"><X className="size-3" /></button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex size-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                <ImagePlus className="size-5" />
                <span className="text-[11px] font-medium">Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onPickPhotos(e.target.files)} />
          <p className="text-xs text-muted-foreground">Up to 5 photos (JPG, PNG or WebP, max 5 MB each). Clear, well-lit photos get more requests.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="g-location">General location (never your home address)</Label>
          <Input id="g-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Yaba, Lagos" maxLength={160} />
        </div>

        <div className="flex gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-bold text-primary-800">Safe handover — you never meet the receiver</p>
            <p className="mt-1 text-primary-900/75">
              When you accept a request, the Gap Castle team contacts you to arrange the drop-off at one of our{" "}
              <a href="/pickup-hubs" target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">pickup hubs</a>{" "}
              or a waybill. Receivers collect from the hub or get it by waybill. Never share your home address.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="g-notes">Additional notes (optional)</Label>
          <Input id="g-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Heavy — needs two people to carry. Comes with its charger." />
        </div>

        {!isEdit && (
          <label className="flex items-start gap-2.5 text-sm">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">I confirm that this item is being offered <strong className="text-foreground">for free</strong> and that the description accurately represents its condition.</span>
          </label>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" variant="outline" className="sm:flex-1" disabled={!title.trim()} onClick={() => setPreviewOpen(true)}><Eye className="size-4" /> Preview</Button>
          <Button size="lg" className="sm:flex-1" disabled={!canPublish || saving} onClick={save}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Publish Free Listing"}
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Listing preview</DialogTitle>
            <DialogDescription>This is how members will see your item.</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="relative aspect-[4/3] bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              {previewImage ? <img src={previewImage} alt="" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center bg-gradient-to-br from-secondary to-accent/40 text-4xl">📦</div>}
              <Badge variant="free" className="absolute left-3 top-3 shadow-soft">FREE</Badge>
            </div>
            <div className="space-y-2 p-4">
              <Badge variant="secondary">{categoryName ?? "Uncategorised"}</Badge>
              <h3 className="font-bold">{title}</h3>
              <p className="text-xs text-muted-foreground">
                {CONDITION_LABELS[condition]}
                <span className="mx-1.5 text-border">•</span>Hub pickup or waybill
              </p>
              <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{description}</p>
              <p className="text-sm text-muted-foreground">📍 {location || "Location not set"}</p>
            </div>
          </div>
          <Button size="lg" className="w-full" disabled={!canPublish || saving} onClick={save}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Publish Free Listing"}
          </Button>
          {!valid && <p className="text-center text-xs text-muted-foreground">Fill in the title, description, location and a collection option{isEdit ? "" : ", and confirm the item is free"}.</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Existing photo URLs map back to their storage path (or stay as remote URLs for demo images). */
function pathFromUrl(url: string): string {
  const marker = "/storage/";
  const index = url.indexOf(marker);
  return index >= 0 ? url.slice(index + marker.length) : url;
}
