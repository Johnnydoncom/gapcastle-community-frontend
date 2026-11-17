"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState, type FormEvent } from "react";
import { Clock, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminHeading } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import type { NgState, PickupLocation } from "@/lib/types";
import { cn } from "@/lib/utils";

type HubForm = {
  id?: number;
  state_id: string;
  name: string;
  area: string;
  address: string;
  landmark: string;
  opening_hours: string;
  phone: string;
  notes: string;
  latitude: string;
  longitude: string;
  sort_order: string;
  is_active: boolean;
};

const EMPTY_FORM: HubForm = {
  state_id: "", name: "", area: "", address: "", landmark: "", opening_hours: "Mon–Sat, 9am–5pm",
  phone: "", notes: "", latitude: "", longitude: "", sort_order: "0", is_active: true,
};

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

/**
 * Admin › Pickup locations. Switch pickup on/off per state and manage each
 * state's hubs. Pickup is offered at checkout only when a state is switched on
 * AND has at least one active hub; everyone else gets waybill delivery.
 */
export function AdminLocationsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const [view, setView] = useState<"pickup" | "all">("pickup");
  const [q, setQ] = useState("");
  const search = useDeferredValue(q.trim().toLowerCase());
  const [form, setForm] = useState<HubForm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-locations"],
    queryFn: () => api.get<{ data: NgState[] }>("admin/locations").then((response) => response.data),
  });
  const states = data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-locations"] });

  const visible = states.filter((state) => {
    if (view === "pickup" && !state.pickup_enabled && !state.pickup_locations.length) return false;
    return !search || state.name.toLowerCase().includes(search) || state.pickup_locations.some((hub) => `${hub.name} ${hub.area}`.toLowerCase().includes(search));
  });

  const liveStates = states.filter((state) => state.pickup_available).length;
  const activeHubs = states.reduce((sum, state) => sum + (state.pickup_enabled ? state.pickup_locations.filter((hub) => hub.is_active).length : 0), 0);

  async function toggleState(state: NgState, enabled: boolean) {
    try {
      const response = await api.patch<{ message: string }>(`admin/states/${state.id}`, { pickup_enabled: enabled });
      toast.success(response.message);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update state"));
    }
  }

  async function toggleHub(hub: PickupLocation) {
    try {
      await api.put(`admin/pickup-locations/${hub.id}`, { ...hubPayload(toForm(hub)), is_active: !hub.is_active });
      toast.success(hub.is_active ? `${hub.name} deactivated` : `${hub.name} is open again`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update hub"));
    }
  }

  async function deleteHub(hub: PickupLocation) {
    if (!confirm(`Delete ${hub.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`admin/pickup-locations/${hub.id}`);
      toast.success("Pickup hub deleted");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete hub"));
    }
  }

  return (
    <div>
      <AdminHeading
        eyebrow="Logistics"
        title="Pickup locations"
        description="Choose which states offer pickup and manage the hubs in them. States without an active hub automatically get waybill delivery at checkout."
        action={isAdmin && <Button onClick={() => setForm({ ...EMPTY_FORM })}><Plus className="size-4" /> Add pickup hub</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="States with live pickup" value={liveStates} />
        <Stat label="Active hubs" value={activeHubs} />
        <Stat label="Waybill-only states" value={states.length - liveStates} className="col-span-2 sm:col-span-1" />
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search states or hubs" className="h-10 max-w-xs" aria-label="Search states or hubs" />
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm" role="tablist">
          {(["pickup", "all"] as const).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={view === option} onClick={() => setView(option)} className={cn("rounded-md px-3 py-1.5 font-medium transition-colors", view === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {option === "pickup" ? "Pickup states" : "All 37 states"}
            </button>
          ))}
        </div>
      </div>

      {!isAdmin && <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">You can view pickup locations. Only administrators can change them.</p>}

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : (
        <div className="space-y-4">
          {visible.map((state) => {
            const activeCount = state.pickup_locations.filter((hub) => hub.is_active).length;
            const status = state.pickup_available ? { label: "Live", variant: "success" as const } : state.pickup_enabled ? { label: "No active hub", variant: "warning" as const } : { label: "Waybill only", variant: "muted" as const };
            return (
              <section key={state.id} className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby={`state-${state.id}`}>
                <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary"><MapPin className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <h2 id={`state-${state.id}`} className="font-bold">{state.name} <span className="text-xs font-medium text-muted-foreground">{state.code}</span></h2>
                    <p className="text-xs text-muted-foreground">{activeCount} active of {state.pickup_locations.length} hub{state.pickup_locations.length === 1 ? "" : "s"}</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch checked={state.pickup_enabled} disabled={!isAdmin} onCheckedChange={(checked) => void toggleState(state, checked)} aria-label={`Pickup in ${state.name}`} />
                    Pickup
                  </label>
                </div>

                {state.pickup_locations.length ? (
                  <ul className="divide-y divide-border">
                    {state.pickup_locations.map((hub) => (
                      <li key={hub.id} className={cn("flex flex-wrap items-start gap-3 px-4 py-3 text-sm", !hub.is_active && "bg-muted/30")}>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{hub.name} <span className="font-normal text-muted-foreground">· {hub.area}</span></p>
                          <p className="text-muted-foreground">{hub.address}{hub.landmark ? ` (near ${hub.landmark})` : ""}</p>
                          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {hub.opening_hours && <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {hub.opening_hours}</span>}
                            {hub.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" /> {hub.phone}</span>}
                            <span>{hub.requests_count ?? 0} request{hub.requests_count === 1 ? "" : "s"}</span>
                          </p>
                        </div>
                        <Badge variant={hub.is_active ? "success" : "muted"}>{hub.is_active ? "Open" : "Inactive"}</Badge>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => void toggleHub(hub)}>{hub.is_active ? "Deactivate" : "Activate"}</Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => setForm(toForm(hub))} aria-label={`Edit ${hub.name}`}><Pencil className="size-4" /></Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => void deleteHub(hub)} aria-label={`Delete ${hub.name}`} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /></Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-4 text-sm text-muted-foreground">No hubs yet{state.pickup_enabled ? " — pickup won't be offered until you add one." : "."}</p>
                )}

                {isAdmin && (
                  <div className="border-t border-border px-4 py-2.5">
                    <Button size="sm" variant="ghost" onClick={() => setForm({ ...EMPTY_FORM, state_id: String(state.id) })}><Plus className="size-4" /> Add hub in {state.name}</Button>
                  </div>
                )}
              </section>
            );
          })}
          {!visible.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No states match. Try “All 37 states”.</p>}
        </div>
      )}

      <HubDialog form={form} states={states} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4", className)}>
      <p className="text-2xl font-extrabold text-primary-700">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function toForm(hub: PickupLocation): HubForm {
  return {
    id: hub.id,
    state_id: String(hub.state_id),
    name: hub.name,
    area: hub.area,
    address: hub.address,
    landmark: hub.landmark ?? "",
    opening_hours: hub.opening_hours ?? "",
    phone: hub.phone ?? "",
    notes: hub.notes ?? "",
    latitude: hub.latitude?.toString() ?? "",
    longitude: hub.longitude?.toString() ?? "",
    sort_order: String(hub.sort_order ?? 0),
    is_active: hub.is_active,
  };
}

function hubPayload(form: HubForm) {
  const orNull = (value: string) => (value.trim() ? value.trim() : null);
  return {
    state_id: Number(form.state_id),
    name: form.name.trim(),
    area: form.area.trim(),
    address: form.address.trim(),
    landmark: orNull(form.landmark),
    opening_hours: orNull(form.opening_hours),
    phone: orNull(form.phone),
    notes: orNull(form.notes),
    latitude: form.latitude.trim() ? Number(form.latitude) : null,
    longitude: form.longitude.trim() ? Number(form.longitude) : null,
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  };
}

function HubDialog({ form, states, onClose, onSaved }: { form: HubForm | null; states: NgState[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<HubForm>(EMPTY_FORM);
  const [openedFor, setOpenedFor] = useState<HubForm | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset the draft whenever the dialog opens for a different hub.
  if (form !== openedFor) {
    setOpenedFor(form);
    if (form) setDraft(form);
  }

  const set = (key: keyof HubForm) => (event: { target: { value: string } }) => setDraft((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (draft.id) {
        await api.put(`admin/pickup-locations/${draft.id}`, hubPayload(draft));
        toast.success("Pickup hub saved");
      } else {
        await api.post("admin/pickup-locations", hubPayload(draft));
        toast.success("Pickup hub added");
      }
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save hub"));
    } finally {
      setBusy(false);
    }
  }

  const sortedStates = [...states].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={!!form} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit pickup hub" : "Add pickup hub"}</DialogTitle>
          <DialogDescription>Hub addresses are business premises and are shown publicly to members.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="State">
              <Select value={draft.state_id} onChange={set("state_id")} required>
                <option value="" disabled>Choose a state…</option>
                {sortedStates.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </Select>
            </Field>
            <Field label="Area / LGA"><Input value={draft.area} onChange={set("area")} required minLength={2} maxLength={120} placeholder="e.g. Ikeja" /></Field>
          </div>
          <Field label="Hub name"><Input value={draft.name} onChange={set("name")} required minLength={3} maxLength={120} placeholder="e.g. Ikeja Pickup Hub" /></Field>
          <Field label="Street address"><Input value={draft.address} onChange={set("address")} required minLength={5} maxLength={255} placeholder="e.g. 12 Allen Avenue" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Landmark (optional)"><Input value={draft.landmark} onChange={set("landmark")} maxLength={160} /></Field>
            <Field label="Opening hours"><Input value={draft.opening_hours} onChange={set("opening_hours")} maxLength={160} /></Field>
            <Field label="Phone (optional)"><Input type="tel" value={draft.phone} onChange={set("phone")} maxLength={32} placeholder="0803 123 4567" /></Field>
            <Field label="Display order"><Input type="number" min={0} max={1000} value={draft.sort_order} onChange={set("sort_order")} /></Field>
            <Field label="Latitude (optional)"><Input inputMode="decimal" value={draft.latitude} onChange={set("latitude")} placeholder="6.6018" /></Field>
            <Field label="Longitude (optional)"><Input inputMode="decimal" value={draft.longitude} onChange={set("longitude")} placeholder="3.3515" /></Field>
          </div>
          <Field label="Notes for receivers (optional)"><Textarea value={draft.notes} onChange={set("notes")} rows={2} maxLength={1000} placeholder="e.g. Bring a valid ID. Ask for the Gratis Castle desk." /></Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={draft.is_active} onCheckedChange={(checked) => setDraft((current) => ({ ...current, is_active: checked === true }))} />
            Open for pickups
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save hub"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
