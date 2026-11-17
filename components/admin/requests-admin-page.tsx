"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState, type FormEvent } from "react";
import { ExternalLink, MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, STATUS_TONE, SearchInput, Toolbar, errorMessage, humanize } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";
import type { NgState } from "@/lib/types";

type Waybill = { method: string; provider: string | null; fee_amount: number | null; fee_payer: string; notes: string | null; receiver_confirmed: boolean };
type AdminRequest = {
  id: number; status: string; fulfillment_method: "pickup" | "delivery";
  listing: { id: number; title: string; slug: string } | null;
  giver: { name: string; slug: string } | null;
  requester: { name: string; slug: string; email: string } | null;
  state: string | null; hub: string | null; phone: string | null; delivery: string | null; waybill: Waybill | null; created_at: string;
};
type Page = { data: AdminRequest[]; meta: { current_page: number; last_page: number; total: number } };

/**
 * Logistics view of every request. Givers and receivers never meet, so the
 * Gratis Castle team uses this screen to run hub drop-offs/collections and to set
 * up waybills (with any transport cost disclosed to the receiver).
 */
export function AdminRequestsPage() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [method, setMethod] = useState("");
  const [state, setState] = useState("");
  const [page, setPage] = useState(1);
  const [waybillFor, setWaybillFor] = useState<AdminRequest | null>(null);
  const search = useDeferredValue(q);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests", search, status, method, state, page],
    queryFn: () => api.get<Page>("admin/requests", { q: search || undefined, status: status || undefined, method: method || undefined, state: state || undefined, page }),
    placeholderData: (previous) => previous,
  });
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => api.get<{ data: NgState[] }>("states").then((response) => response.data),
    staleTime: 5 * 60_000,
  });
  const reset = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };

  return (
    <div>
      <PageHeader title="Requests" description="Every request across Nigeria. Contact details and delivery addresses appear once the giver accepts — they are never shown to the giver." />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <Toolbar>
          <SearchInput value={q} onChange={reset(setQ)} placeholder="Search item or requester" />
          <FilterSelect label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option>
            {["pending", "accepted", "completed", "declined", "cancelled"].map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
          </FilterSelect>
          <FilterSelect label="Collection" value={method} onChange={reset(setMethod)}>
            <option value="">Hub & waybill</option>
            <option value="pickup">Pickup hub</option>
            <option value="delivery">Waybill</option>
          </FilterSelect>
          <FilterSelect label="State" value={state} onChange={reset(setState)}>
            <option value="">All states</option>
            {[...(states ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </FilterSelect>
        </Toolbar>

        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={1000}
          head={<tr><th>Item</th><th>Giver → Receiver</th><th>Collection</th><th>Receiver contact</th><th>Status</th><th>Requested</th><th className="w-10" /></tr>}
        >
          {data?.data.map((row) => (
            <tr key={row.id}>
              <td className="max-w-56">
                <p className="truncate font-semibold">{row.listing?.title ?? "Deleted listing"}</p>
                <p className="text-xs text-muted-foreground">#{row.id}</p>
              </td>
              <td className="text-muted-foreground">
                <span className="text-foreground">{row.giver?.name ?? "—"}</span> → <span className="text-foreground">{row.requester?.name ?? "—"}</span>
              </td>
              <td>
                <p className="flex items-center gap-1.5 font-medium">
                  {row.fulfillment_method === "pickup" ? <MapPin className="size-3.5 text-primary" /> : <Truck className="size-3.5 text-brand-yellow-700" />}
                  {row.fulfillment_method === "pickup" ? "Pickup hub" : "Waybill"}
                </p>
                <p className="text-xs text-muted-foreground">{row.fulfillment_method === "pickup" ? row.hub ?? "—" : row.state ?? "—"}</p>
                {row.waybill && (
                  <p className="text-xs text-muted-foreground">
                    {row.waybill.provider ?? "Courier"}{row.waybill.fee_amount ? ` · ₦${row.waybill.fee_amount.toLocaleString("en-NG")}` : " · no cost"}{row.waybill.receiver_confirmed ? " · confirmed" : " · awaiting receiver"}
                  </p>
                )}
              </td>
              <td className="text-xs text-muted-foreground">
                {row.phone || row.delivery ? (
                  <>
                    {row.phone && <a href={`tel:${row.phone}`} className="block font-medium text-primary">{row.phone}</a>}
                    {row.delivery && <span className="block max-w-56">{row.delivery}</span>}
                  </>
                ) : "Shown after acceptance"}
              </td>
              <td><Pill tone={STATUS_TONE[row.status]}>{humanize(row.status)}</Pill></td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(row.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: row.waybill ? "Update waybill" : "Set up waybill", icon: <Truck className="size-4" />, onSelect: () => setWaybillFor(row), hidden: !(row.status === "accepted" && row.fulfillment_method === "delivery") },
                  { label: "View item", icon: <ExternalLink className="size-4" />, onSelect: () => row.listing && window.open(listingPath(row.listing.slug), "_blank"), hidden: !row.listing },
                  { label: "Receiver profile", icon: <ExternalLink className="size-4" />, onSelect: () => row.requester && window.open(profilePath(row.requester.slug), "_blank"), hidden: !row.requester },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Need to change a hub? Manage hubs in <Link href="/admin/locations" className="font-semibold text-primary">Pickup locations</Link>.</p>

      <WaybillDialog request={waybillFor} onClose={() => setWaybillFor(null)} onSaved={() => { setWaybillFor(null); void queryClient.invalidateQueries({ queryKey: ["admin-requests"] }); }} />
    </div>
  );
}

function WaybillDialog({ request, onClose, onSaved }: { request: AdminRequest | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ method: "courier", provider: "", fee_amount: "", fee_payer: "receiver", notes: "" });
  const [openedFor, setOpenedFor] = useState<AdminRequest | null>(null);
  const [busy, setBusy] = useState(false);

  if (request !== openedFor) {
    setOpenedFor(request);
    const waybill = request?.waybill;
    setForm({
      method: waybill?.method === "receiver_arranges" ? "receiver_arranges" : "courier",
      provider: waybill?.provider ?? "",
      fee_amount: waybill?.fee_amount ? String(waybill.fee_amount) : "",
      fee_payer: waybill && waybill.fee_payer !== "none" ? waybill.fee_payer : "receiver",
      notes: waybill?.notes ?? "",
    });
  }

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!request) return;
    setBusy(true);
    try {
      await api.put(`requests/${request.id}/delivery`, {
        method: form.method,
        provider: form.provider || null,
        fee_amount: form.fee_amount ? Number(form.fee_amount) : null,
        fee_payer: form.fee_payer,
        notes: form.notes || null,
      });
      toast.success("Waybill details shared with the receiver");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save waybill"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Waybill for “{request?.listing?.title}”</DialogTitle>
          <DialogDescription>The receiver sees this and must confirm any transport cost before it&apos;s sent. The item itself stays free.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How it travels">
              <Select value={form.method} onChange={set("method")}>
                <option value="courier">Courier / waybill company</option>
                <option value="receiver_arranges">Receiver collects at waybill park</option>
              </Select>
            </Field>
            <Field label="Provider (optional)"><Input value={form.provider} onChange={set("provider")} maxLength={60} placeholder="e.g. GIG Logistics" /></Field>
            <Field label="Transport cost (₦)" hint="Leave empty if there's no cost."><Input type="number" min={0} step="50" inputMode="numeric" value={form.fee_amount} onChange={set("fee_amount")} /></Field>
            <Field label="Who pays the cost">
              <Select value={form.fee_payer} onChange={set("fee_payer")}>
                <option value="receiver">Receiver</option>
                <option value="giver">Giver</option>
                <option value="split">Split</option>
              </Select>
            </Field>
          </div>
          <Field label="Notes for the receiver (optional)"><Textarea value={form.notes} onChange={set("notes")} rows={3} maxLength={1000} placeholder="e.g. Ready for collection at Jibowu park from Thursday. Bring a valid ID." /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Share with receiver"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
