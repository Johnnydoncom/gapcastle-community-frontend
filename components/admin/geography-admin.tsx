"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { Clock, MapPin, Pencil, Phone, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, SearchInput, StatCard, TableCard, Toolbar,
  errorMessage, fieldErrors, useConfirm, useTableState, type Paged,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";

export type AdminState = {
  id: number; name: string; slug: string; code: string; pickup_enabled: boolean; pickup_available: boolean; sort_order: number;
  latitude: number | null; longitude: number | null; lgas_count: number; hubs_count: number; active_hubs_count: number;
  listings_count: number; members_count: number;
};
type AdminLga = { id: number; name: string; slug: string; state_id: number; state: { id: number; name: string; code: string } | null; latitude: number; longitude: number; listings_count: number; members_count: number };
type AdminHub = {
  id: number; state_id: number; name: string; area: string; address: string; landmark: string | null; opening_hours: string | null; phone: string | null;
  notes: string | null; latitude: number | null; longitude: number | null; is_active: boolean; sort_order: number;
  state?: { id: number; name: string; slug: string }; requests_count?: number; state_pickup_enabled: boolean;
};

/** Every state, for dropdowns. Shared cache across the location screens and the listing editor. */
export function useAllStates() {
  return useQuery({
    queryKey: ["admin-states-all"],
    queryFn: () => api.get<{ data: AdminState[] }>("admin/states", { all: true }).then((response) => response.data),
    staleTime: 5 * 60_000,
  });
}

function useLocationRefresh() {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["admin-states", "admin-states-all", "admin-lgas", "admin-hubs", "admin-locations", "states", "lgas"]) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
}

function StateOptions({ states, placeholder }: { states: AdminState[]; placeholder?: string }) {
  return (
    <>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
    </>
  );
}

function AdminOnlyNote({ isAdmin, what }: { isAdmin: boolean; what: string }) {
  return isAdmin ? null : <p className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">You can view {what}. Only administrators can change them.</p>;
}

function LocationTabs({ active }: { active: "hubs" | "states" | "lgas" }) {
  const tabs = [
    { key: "hubs", href: "/admin/locations", label: "Pickup hubs" },
    { key: "states", href: "/admin/states", label: "States" },
    { key: "lgas", href: "/admin/lgas", label: "LGAs" },
  ];
  return (
    <div className="mb-5 inline-flex rounded-xl border border-border bg-card p-1 text-sm shadow-soft" role="tablist" aria-label="Locations">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href} role="tab" aria-selected={active === tab.key} className={active === tab.key ? "rounded-lg bg-primary px-4 py-1.5 font-semibold text-primary-foreground" : "rounded-lg px-4 py-1.5 font-medium text-muted-foreground hover:text-foreground"}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

/* ---------------------------------- States ---------------------------------- */

type StateForm = { id?: number; name: string; code: string; pickup_enabled: boolean; sort_order: string; latitude: string; longitude: string };

export function AdminStatesPage() {
  const router = useRouter();
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const refresh = useLocationRefresh();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ pickup: "" }, 50);
  const [form, setForm] = useState<StateForm | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-states", table.query],
    queryFn: () => api.get<Paged<AdminState>>("admin/states", table.query),
    placeholderData: (previous) => previous,
  });
  const { data: all } = useAllStates();

  async function togglePickup(state: AdminState, enabled: boolean) {
    try {
      const response = await api.patch<{ message: string }>(`admin/states/${state.id}`, { pickup_enabled: enabled });
      toast.success(response.message);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update state"));
    }
  }

  return (
    <div>
      <PageHeader
        title="States"
        description="Nigerian states used for listing locations, member profiles, delivery and pickup. Switch pickup on where a Gratis Castle hub operates."
        actions={isAdmin && <Button onClick={() => setForm({ name: "", code: "", pickup_enabled: false, sort_order: "0", latitude: "", longitude: "" })}><Plus className="size-4" /> Add state</Button>}
      />
      <LocationTabs active="states" />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="States" value={all?.length ?? "—"} />
        <StatCard label="With live pickup" value={all?.filter((state) => state.pickup_available).length ?? "—"} />
        <StatCard label="LGAs" value={all ? all.reduce((sum, state) => sum + state.lgas_count, 0).toLocaleString("en-NG") : "—"} />
        <StatCard label="Pickup hubs" value={all ? all.reduce((sum, state) => sum + state.hubs_count, 0) : "—"} />
      </div>
      <AdminOnlyNote isAdmin={isAdmin} what="states" />

      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search state or code" />
          <FilterSelect label="Pickup" value={table.filters.pickup} onChange={(value) => table.setFilter("pickup", value)}>
            <option value="">Pickup on and off</option>
            <option value="on">Pickup switched on</option>
            <option value="off">Delivery only</option>
          </FilterSelect>
        </Toolbar>
        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={900}
          head={<tr><th>State</th><th>Code</th><th className="text-right">LGAs</th><th className="text-right">Hubs</th><th className="text-right">Listings</th><th className="text-right">Members</th><th>Pickup</th><th className="w-10" /></tr>}
        >
          {data?.data.map((state) => (
            <tr key={state.id}>
              <td>
                <p className="font-semibold">{state.name}</p>
                <p className="text-xs text-muted-foreground">{state.latitude !== null ? `${state.latitude.toFixed(3)}, ${state.longitude?.toFixed(3)}` : "No centre point"}</p>
              </td>
              <td className="font-mono text-xs">{state.code}</td>
              <td className="text-right tabular-nums"><Link href={`/admin/lgas?state=${state.id}`} className="font-semibold text-primary hover:underline">{state.lgas_count}</Link></td>
              <td className="text-right tabular-nums"><Link href={`/admin/locations?state=${state.id}`} className="hover:underline">{state.active_hubs_count}/{state.hubs_count}</Link></td>
              <td className="text-right tabular-nums">{state.listings_count}</td>
              <td className="text-right tabular-nums">{state.members_count}</td>
              <td>
                <div className="flex items-center gap-2">
                  <Switch checked={state.pickup_enabled} disabled={!isAdmin} onCheckedChange={(checked) => void togglePickup(state, checked)} aria-label={`Pickup in ${state.name}`} />
                  {state.pickup_available ? <Pill tone="green">Live</Pill> : state.pickup_enabled ? <Pill tone="yellow">No active hub</Pill> : <Pill>Delivery only</Pill>}
                </div>
              </td>
              <td>
                <RowActions items={[
                  { label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin, onSelect: () => setForm({ id: state.id, name: state.name, code: state.code, pickup_enabled: state.pickup_enabled, sort_order: String(state.sort_order), latitude: state.latitude?.toString() ?? "", longitude: state.longitude?.toString() ?? "" }) },
                  { label: "Manage LGAs", icon: <MapPin className="size-4" />, onSelect: () => router.push(`/admin/lgas?state=${state.id}`) },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                    onSelect: () => confirm({
                      title: `Delete ${state.name}?`,
                      description: "Its LGAs are deleted too. States used by listings, members, orders or hubs can't be deleted.",
                      action: async () => {
                        try {
                          await api.delete(`admin/states/${state.id}`);
                          toast.success(`${state.name} deleted`);
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete state"));
                        }
                      },
                    }),
                  },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>

      <EditDialog
        open={!!form}
        title={form?.id ? "Edit state" : "Add state"}
        description="States are shown in every location dropdown on the site."
        onClose={() => setForm(null)}
        onSubmit={async () => {
          if (!form) return {};
          const payload = { name: form.name.trim(), code: form.code.trim(), pickup_enabled: form.pickup_enabled, sort_order: Number(form.sort_order) || 0, latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null };
          if (form.id) await api.patch(`admin/states/${form.id}`, payload);
          else await api.post("admin/states", payload);
          toast.success(form.id ? "State saved" : "State added");
          setForm(null);
          refresh();
          return {};
        }}
      >
        {(errors) => form && (
          <>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <Field label="Name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={60} placeholder="e.g. Lagos" /></Field>
              <Field label="Code" error={errors.code}><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required minLength={2} maxLength={4} placeholder="LA" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Centre latitude" error={errors.latitude}><Input inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="6.524" /></Field>
              <Field label="Centre longitude" error={errors.longitude}><Input inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="3.379" /></Field>
              <Field label="Display order" error={errors.sort_order}><Input type="number" min={0} max={1000} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium">
              <span>Offer hub pickup in this state<span className="block text-xs font-normal text-muted-foreground">Only takes effect once the state has an active hub.</span></span>
              <Switch checked={form.pickup_enabled} onCheckedChange={(checked) => setForm({ ...form, pickup_enabled: checked })} />
            </label>
          </>
        )}
      </EditDialog>
      {confirmDialog}
    </div>
  );
}

/* ----------------------------------- LGAs ----------------------------------- */

type LgaForm = { id?: number; state_id: string; name: string; latitude: string; longitude: string };

export function AdminLgasPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const refresh = useLocationRefresh();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ state: "" }, 50);
  const [form, setForm] = useState<LgaForm | null>(null);
  const { data: states = [] } = useAllStates();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lgas", table.query],
    queryFn: () => api.get<Paged<AdminLga>>("admin/lgas", table.query),
    placeholderData: (previous) => previous,
  });
  const currentState = states.find((state) => String(state.id) === table.filters.state);

  return (
    <div>
      <PageHeader
        title="Local Government Areas"
        description="All 774 LGAs with their centre points. Givers pick one when listing an item, and “near me” ranking measures distance between LGA centres."
        actions={isAdmin && <Button onClick={() => setForm({ state_id: table.filters.state, name: "", latitude: "", longitude: "" })}><Plus className="size-4" /> Add LGA</Button>}
      />
      <LocationTabs active="lgas" />
      <AdminOnlyNote isAdmin={isAdmin} what="LGAs" />

      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search LGA name" />
          <FilterSelect label="State" value={table.filters.state} onChange={(value) => table.setFilter("state", value)}>
            <StateOptions states={states} placeholder="All states" />
          </FilterSelect>
          {currentState && <span className="text-sm text-muted-foreground">{currentState.lgas_count} LGAs in {currentState.name}</span>}
        </Toolbar>
        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={760}
          head={<tr><th>LGA</th><th>State</th><th>Centre point</th><th className="text-right">Listings</th><th className="text-right">Members</th><th className="w-10" /></tr>}
        >
          {data?.data.map((lga) => (
            <tr key={lga.id}>
              <td><p className="font-semibold">{lga.name}</p><p className="font-mono text-[11px] text-muted-foreground">{lga.slug}</p></td>
              <td>{lga.state ? <button type="button" className="hover:text-primary hover:underline" onClick={() => table.setFilter("state", String(lga.state_id))}>{lga.state.name}</button> : "—"}</td>
              <td className="font-mono text-xs text-muted-foreground">{lga.latitude.toFixed(4)}, {lga.longitude.toFixed(4)}</td>
              <td className="text-right tabular-nums">{lga.listings_count}</td>
              <td className="text-right tabular-nums">{lga.members_count}</td>
              <td>
                <RowActions items={[
                  { label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin, onSelect: () => setForm({ id: lga.id, state_id: String(lga.state_id), name: lga.name, latitude: String(lga.latitude), longitude: String(lga.longitude) }) },
                  { label: "View on map", icon: <MapPin className="size-4" />, onSelect: () => window.open(`https://www.openstreetmap.org/?mlat=${lga.latitude}&mlon=${lga.longitude}#map=12/${lga.latitude}/${lga.longitude}`, "_blank", "noopener") },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                    onSelect: () => confirm({
                      title: `Delete ${lga.name}?`,
                      description: lga.listings_count || lga.members_count ? "Listings or members use this LGA, so it can't be deleted." : "This can't be undone.",
                      action: async () => {
                        try {
                          await api.delete(`admin/lgas/${lga.id}`);
                          toast.success(`${lga.name} deleted`);
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete LGA"));
                        }
                      },
                    }),
                  },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>

      <EditDialog
        open={!!form}
        title={form?.id ? "Edit LGA" : "Add LGA"}
        description="The centre point is used to rank listings by distance — it is never a person's address."
        onClose={() => setForm(null)}
        onSubmit={async () => {
          if (!form) return {};
          const payload = { state_id: Number(form.state_id), name: form.name.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude) };
          if (form.id) await api.put(`admin/lgas/${form.id}`, payload);
          else await api.post("admin/lgas", payload);
          toast.success(form.id ? "LGA saved" : "LGA added");
          setForm(null);
          refresh();
          return {};
        }}
      >
        {(errors) => form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State" error={errors.state_id}>
                <Select value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })} required>
                  <option value="" disabled>Choose a state…</option>
                  <StateOptions states={states} />
                </Select>
              </Field>
              <Field label="LGA name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} placeholder="e.g. Eti-Osa" /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Centre latitude" error={errors.latitude}><Input inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required placeholder="6.4589" /></Field>
              <Field label="Centre longitude" error={errors.longitude}><Input inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required placeholder="3.6015" /></Field>
            </div>
            <p className="text-xs text-muted-foreground">Tip: search the LGA headquarters on OpenStreetMap and copy its coordinates.</p>
          </>
        )}
      </EditDialog>
      {confirmDialog}
    </div>
  );
}

/* -------------------------------- Pickup hubs ------------------------------- */

type HubForm = {
  id?: number; state_id: string; name: string; area: string; address: string; landmark: string; opening_hours: string;
  phone: string; notes: string; latitude: string; longitude: string; sort_order: string; is_active: boolean;
};

const EMPTY_HUB: HubForm = {
  state_id: "", name: "", area: "", address: "", landmark: "", opening_hours: "Mon–Sat, 9am–5pm",
  phone: "", notes: "", latitude: "", longitude: "", sort_order: "0", is_active: true,
};

function hubToForm(hub: AdminHub): HubForm {
  return {
    id: hub.id, state_id: String(hub.state_id), name: hub.name, area: hub.area, address: hub.address, landmark: hub.landmark ?? "",
    opening_hours: hub.opening_hours ?? "", phone: hub.phone ?? "", notes: hub.notes ?? "", latitude: hub.latitude?.toString() ?? "",
    longitude: hub.longitude?.toString() ?? "", sort_order: String(hub.sort_order ?? 0), is_active: hub.is_active,
  };
}

function hubPayload(form: HubForm) {
  const orNull = (value: string) => (value.trim() ? value.trim() : null);
  return {
    state_id: Number(form.state_id), name: form.name.trim(), area: form.area.trim(), address: form.address.trim(),
    landmark: orNull(form.landmark), opening_hours: orNull(form.opening_hours), phone: orNull(form.phone), notes: orNull(form.notes),
    latitude: form.latitude.trim() ? Number(form.latitude) : null, longitude: form.longitude.trim() ? Number(form.longitude) : null,
    sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
  };
}

/**
 * Admin › Pickup hubs. Pickup is offered at checkout only when a state is switched on
 * AND has at least one active hub; everyone else gets free delivery.
 */
export function AdminLocationsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const refresh = useLocationRefresh();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ state: "", status: "" });
  const [form, setForm] = useState<HubForm | null>(null);
  const { data: states = [] } = useAllStates();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-hubs", table.query],
    queryFn: () => api.get<Paged<AdminHub>>("admin/pickup-locations", table.query),
    placeholderData: (previous) => previous,
  });

  async function toggleHub(hub: AdminHub) {
    try {
      await api.put(`admin/pickup-locations/${hub.id}`, { ...hubPayload(hubToForm(hub)), is_active: !hub.is_active });
      toast.success(hub.is_active ? `${hub.name} deactivated` : `${hub.name} is open again`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update hub"));
    }
  }

  const liveStates = states.filter((state) => state.pickup_available).length;

  return (
    <div>
      <PageHeader
        title="Pickup hubs"
        description="Gratis Castle's own premises where givers drop items and receivers collect them. States without an active hub automatically get free delivery at checkout."
        actions={isAdmin && <Button onClick={() => setForm({ ...EMPTY_HUB, state_id: table.filters.state })}><Plus className="size-4" /> Add pickup hub</Button>}
      />
      <LocationTabs active="hubs" />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="States with live pickup" value={liveStates} />
        <StatCard label="Active hubs" value={states.reduce((sum, state) => sum + (state.pickup_enabled ? state.active_hubs_count : 0), 0)} />
        <StatCard label="Delivery-only states" value={states.length - liveStates} />
      </div>
      <AdminOnlyNote isAdmin={isAdmin} what="pickup hubs" />

      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search hub, area or address" />
          <FilterSelect label="State" value={table.filters.state} onChange={(value) => table.setFilter("state", value)}>
            <StateOptions states={states} placeholder="All states" />
          </FilterSelect>
          <FilterSelect label="Status" value={table.filters.status} onChange={(value) => table.setFilter("status", value)}>
            <option value="">Open and inactive</option>
            <option value="active">Open</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
        </Toolbar>
        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          emptyText="No pickup hubs match. Add one to offer pickup in a state."
          minWidth={900}
          head={<tr><th>Hub</th><th>State</th><th>Hours &amp; phone</th><th className="text-right">Orders</th><th>Status</th><th className="w-10" /></tr>}
        >
          {data?.data.map((hub) => (
            <tr key={hub.id} className={hub.is_active ? undefined : "bg-muted/30"}>
              <td>
                <p className="font-semibold">{hub.name} <span className="font-normal text-muted-foreground">· {hub.area}</span></p>
                <p className="max-w-md text-xs text-muted-foreground">{hub.address}{hub.landmark ? ` (near ${hub.landmark})` : ""}</p>
              </td>
              <td>
                <p>{hub.state?.name ?? "—"}</p>
                {!hub.state_pickup_enabled && <p className="text-xs text-highlight-soft-foreground">Pickup off in this state</p>}
              </td>
              <td className="text-xs text-muted-foreground">
                {hub.opening_hours && <p className="flex items-center gap-1"><Clock className="size-3" /> {hub.opening_hours}</p>}
                {hub.phone && <p className="flex items-center gap-1"><Phone className="size-3" /> {hub.phone}</p>}
              </td>
              <td className="text-right tabular-nums">{hub.requests_count ?? 0}</td>
              <td>{hub.is_active ? <Pill tone="green">Open</Pill> : <Pill>Inactive</Pill>}</td>
              <td>
                <RowActions items={[
                  { label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin, onSelect: () => setForm(hubToForm(hub)) },
                  { label: hub.is_active ? "Deactivate" : "Activate", icon: <Power className="size-4" />, hidden: !isAdmin, onSelect: () => void toggleHub(hub) },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                    onSelect: () => confirm({
                      title: `Delete ${hub.name}?`,
                      description: hub.requests_count ? "This hub has been used for orders, so it can't be deleted — deactivate it instead." : "This can't be undone.",
                      action: async () => {
                        try {
                          await api.delete(`admin/pickup-locations/${hub.id}`);
                          toast.success("Pickup hub deleted");
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete hub"));
                        }
                      },
                    }),
                  },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>

      <EditDialog
        open={!!form}
        wide
        title={form?.id ? "Edit pickup hub" : "Add pickup hub"}
        description="Hub addresses are business premises and are shown publicly to members."
        onClose={() => setForm(null)}
        onSubmit={async () => {
          if (!form) return {};
          if (form.id) await api.put(`admin/pickup-locations/${form.id}`, hubPayload(form));
          else await api.post("admin/pickup-locations", hubPayload(form));
          toast.success(form.id ? "Pickup hub saved" : "Pickup hub added");
          setForm(null);
          refresh();
          return {};
        }}
      >
        {(errors) => form && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State" error={errors.state_id}>
                <Select value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })} required>
                  <option value="" disabled>Choose a state…</option>
                  <StateOptions states={states} />
                </Select>
              </Field>
              <Field label="Area / LGA" error={errors.area}><Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} required minLength={2} maxLength={120} placeholder="e.g. Ikeja" /></Field>
            </div>
            <Field label="Hub name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={3} maxLength={120} placeholder="e.g. Ikeja Pickup Hub" /></Field>
            <Field label="Street address" error={errors.address}><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required minLength={5} maxLength={255} placeholder="e.g. 12 Allen Avenue" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Landmark (optional)" error={errors.landmark}><Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} maxLength={160} /></Field>
              <Field label="Opening hours" error={errors.opening_hours}><Input value={form.opening_hours} onChange={(e) => setForm({ ...form, opening_hours: e.target.value })} maxLength={160} /></Field>
              <Field label="Phone (optional)" error={errors.phone}><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={32} placeholder="0803 123 4567" /></Field>
              <Field label="Display order" error={errors.sort_order}><Input type="number" min={0} max={1000} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></Field>
              <Field label="Latitude (optional)" error={errors.latitude}><Input inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="6.6018" /></Field>
              <Field label="Longitude (optional)" error={errors.longitude}><Input inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="3.3515" /></Field>
            </div>
            <Field label="Notes for receivers (optional)" error={errors.notes}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} maxLength={1000} placeholder="e.g. Bring a valid ID. Ask for the Gratis Castle desk." /></Field>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium">
              Open for pickups
              <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
            </label>
          </>
        )}
      </EditDialog>
      {confirmDialog}
    </div>
  );
}

/** A small form dialog (for short records only — rich content gets its own page). Shows field errors inline. */
function EditDialog({ open, title, description, onClose, onSubmit, children, wide }: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onSubmit: () => Promise<Record<string, string>>;
  children: (errors: Record<string, string>) => ReactNode;
  wide?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await onSubmit();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) { setErrors({}); onClose(); } }}>
      <DialogContent className={wide ? "max-h-[90vh] overflow-y-auto sm:max-w-2xl" : "max-h-[90vh] overflow-y-auto sm:max-w-lg"}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {children(errors)}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
