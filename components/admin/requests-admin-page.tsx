"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Bike, ExternalLink, Loader2, MapPin, PackageCheck, Settings2, Store, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAllStates } from "@/components/admin/geography-admin";
import { DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, STATUS_TONE, SearchInput, TableCard, Toolbar, errorMessage, useTableState, type PageMeta } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { api } from "@/lib/api";
import { REQUEST_STATUS_LABELS, timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";
import type { FulfillmentStage, OrderCharges } from "@/lib/types";
import { formatNaira } from "@/lib/utils";

type AdminOrder = {
  id: number;
  order_number: string;
  status: string;
  fulfillment_method: "pickup" | "delivery";
  fulfillment_stage: FulfillmentStage | null;
  fulfillment_stage_label: string | null;
  stage_note: string | null;
  listing: { id: number; title: string; slug: string } | null;
  giver: { name: string; slug: string; email: string } | null;
  handover: { method: "hub_dropoff" | "dispatch_pickup" | null; method_label: string | null; state: string | null; area: string; pickup_address: string | null; pickup_phone: string | null; pickup_times: string | null } | null;
  requester: { name: string; slug: string; email: string } | null;
  recipient: { name: string | null; email: string | null; phone: string | null; alt_phone: string | null; address: string | null; city: string | null; landmark: string | null; notes: string | null; best_time: string | null } | null;
  state: string | null;
  hub: string | null;
  charges: OrderCharges;
  received_at: string | null;
  created_at: string;
  claimed_at: string | null;
  stage_updated_at: string | null;
};
type Page = { data: AdminOrder[]; meta: PageMeta; stages: { value: FulfillmentStage; label: string }[] };

const STAGE_TONE: Record<string, "yellow" | "blue" | "green" | "gray"> = {
  awaiting_handover: "yellow",
  at_hub: "blue",
  ready_for_pickup: "green",
  out_for_delivery: "green",
  delivered: "green",
};

/**
 * The orders board. Members never meet, so the Gratis Castle team runs every
 * handover from here: the giver's drop-off or dispatch pickup (with their private
 * address), then free hub collection or delivery to the receiver. Delivery is paid by
 * the receiver: staff quote the fee here before dispatch. Staff move each order
 * through its stages; the receiver is notified at every step.
 */
export function AdminRequestsPage() {
  const queryClient = useQueryClient();
  const table = useTableState({ status: "accepted", stage: "", method: "", state: "" });
  const [managing, setManaging] = useState<AdminOrder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests", table.query],
    queryFn: () => api.get<Page>("admin/requests", { ...table.query, status: table.filters.status === "all" ? undefined : table.filters.status }),
    placeholderData: (previous) => previous,
  });
  const { data: states } = useAllStates();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  return (
    <div>
      <PageHeader title="Orders" description="Every order across Nigeria — items are free, hub pickup is free, delivery is paid by the receiver. Run the handover from the giver to the receiver — contact details here are never shown to the other member." />

      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Order no., item, receiver or email" />
          <FilterSelect label="Status" value={table.filters.status} onChange={(value) => table.setFilter("status", value)}>
            <option value="all">All statuses</option>
            <option value="accepted">In progress</option>
            <option value="completed">Received</option>
            <option value="cancelled">Cancelled</option>
            <option value="declined">Closed</option>
          </FilterSelect>
          <FilterSelect label="Stage" value={table.filters.stage} onChange={(value) => table.setFilter("stage", value)}>
            <option value="">All stages</option>
            {(data?.stages ?? []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Collection" value={table.filters.method} onChange={(value) => table.setFilter("method", value)}>
            <option value="">Pickup & delivery</option>
            <option value="pickup">Hub pickup</option>
            <option value="delivery">Delivery</option>
          </FilterSelect>
          <FilterSelect label="State" value={table.filters.state} onChange={(value) => table.setFilter("state", value)}>
            <option value="">All states</option>
            {(states ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </FilterSelect>
        </Toolbar>

        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={1080}
          head={<tr><th>Order</th><th>Giver → Receiver</th><th>From giver</th><th>To receiver</th><th>Stage</th><th>Placed</th><th className="w-10" /></tr>}
        >
          {data?.data.map((row) => (
            <tr key={row.id}>
              <td className="max-w-56">
                <p className="font-bold">{row.order_number}</p>
                <p className="truncate text-xs text-muted-foreground">{row.listing?.title ?? "Deleted listing"}</p>
              </td>
              <td className="text-muted-foreground">
                <span className="text-foreground">{row.giver?.name ?? "—"}</span> → <span className="text-foreground">{row.recipient?.name ?? row.requester?.name ?? "—"}</span>
              </td>
              <td className="text-xs">
                <p className="flex items-center gap-1.5 font-medium">
                  {row.handover?.method === "dispatch_pickup" ? <Bike className="size-3.5 text-brand-yellow-700" /> : <Store className="size-3.5 text-primary" />}
                  {row.handover?.method === "dispatch_pickup" ? "Dispatch pickup" : "Hub drop-off"}
                </p>
                <p className="text-muted-foreground">{[row.handover?.area, row.handover?.state].filter(Boolean).join(", ") || "—"}</p>
              </td>
              <td className="text-xs">
                <p className="flex items-center gap-1.5 font-medium">
                  {row.fulfillment_method === "pickup" ? <MapPin className="size-3.5 text-primary" /> : <Truck className="size-3.5 text-brand-yellow-700" />}
                  {row.fulfillment_method === "pickup" ? "Hub collection" : "Delivery"}
                  {row.fulfillment_method === "delivery" && (
                    <span className={row.charges?.delivery_fee_status === "quoted" ? "text-muted-foreground" : "font-semibold text-brand-yellow-700"}>
                      · {typeof row.charges?.delivery === "number" ? formatNaira(row.charges.delivery) : "fee not set"}
                    </span>
                  )}
                </p>
                <p className="max-w-48 truncate text-muted-foreground">{row.fulfillment_method === "pickup" ? row.hub ?? "—" : [row.recipient?.city, row.state].filter(Boolean).join(", ") || "—"}</p>
              </td>
              <td>
                {row.status === "accepted" && row.fulfillment_stage ? (
                  <Pill tone={STAGE_TONE[row.fulfillment_stage] ?? "gray"}>{row.fulfillment_stage_label}</Pill>
                ) : (
                  <Pill tone={STATUS_TONE[row.status]}>{REQUEST_STATUS_LABELS[row.status] ?? row.status}</Pill>
                )}
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(row.claimed_at ?? row.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: row.status === "accepted" ? "Manage order" : "View details", icon: <Settings2 className="size-4" />, onSelect: () => setManaging(row) },
                  { label: "View item", icon: <ExternalLink className="size-4" />, onSelect: () => row.listing && window.open(listingPath(row.listing.slug), "_blank"), hidden: !row.listing },
                  { label: "Receiver profile", icon: <ExternalLink className="size-4" />, onSelect: () => row.requester && window.open(profilePath(row.requester.slug), "_blank"), hidden: !row.requester },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>

      <p className="mt-4 text-xs text-muted-foreground">Need to change a hub? Manage hubs in <Link href="/admin/locations" className="font-semibold text-primary">Pickup locations</Link>.</p>

      <ManageOrderDialog order={managing} stages={data?.stages ?? []} onClose={() => setManaging(null)} onSaved={(order) => { setManaging(order); refresh(); }} />
    </div>
  );
}

function ManageOrderDialog({ order, stages, onClose, onSaved }: { order: AdminOrder | null; stages: Page["stages"]; onClose: () => void; onSaved: (order: AdminOrder) => void }) {
  const [stage, setStage] = useState<string>("");
  const [note, setNote] = useState("");
  const [fee, setFee] = useState("");
  const [feeNote, setFeeNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [openedFor, setOpenedFor] = useState<number | null>(null);

  if (order && order.id !== openedFor) {
    setOpenedFor(order.id);
    setStage(order.fulfillment_stage ?? "awaiting_handover");
    setNote("");
    setFee(typeof order.charges?.delivery === "number" ? String(order.charges.delivery) : "");
    setFeeNote(order.charges?.delivery_fee_note ?? "");
  }

  const isPickup = order?.fulfillment_method === "pickup";
  const availableStages = stages.filter((item) => (isPickup ? item.value !== "out_for_delivery" : item.value !== "ready_for_pickup"));
  const inProgress = order?.status === "accepted";

  async function run(action: "stage" | "delivery_fee" | "complete" | "cancel") {
    if (!order) return;
    if (action === "delivery_fee" && (fee.trim() === "" || Number.isNaN(Number(fee)) || Number(fee) < 0)) {
      toast.error("Enter the delivery fee in naira, e.g. 3500.");
      return;
    }
    if (action === "cancel" && !confirm(`Cancel order ${order.order_number}? The item becomes available to other members again.`)) return;
    if (action === "complete" && !confirm(`Mark order ${order.order_number} as completed? The item will be marked as given away.`)) return;
    setBusy(action);
    try {
      const response = await api.patch<{ data: AdminOrder; message: string }>(`admin/requests/${order.id}`, {
        action,
        ...(action === "stage" ? { stage } : {}),
        ...(action === "delivery_fee" ? { delivery_fee: Number(fee) } : {}),
        note: (action === "delivery_fee" ? feeNote : note).trim() || null,
      });
      toast.success(response.message);
      if (action !== "delivery_fee") setNote("");
      onSaved(response.data);
    } catch (err) {
      toast.error(errorMessage(err, "Could not update the order"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle>Order {order.order_number}</DialogTitle>
              <DialogDescription>{order.listing?.title ?? "Deleted listing"} · placed {timeAgo(order.claimed_at ?? order.created_at)}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard title="1. Collect from the giver" icon={order.handover?.method === "dispatch_pickup" ? Bike : Store}>
                <p className="font-semibold">{order.giver?.name ?? "—"}</p>
                <p className="text-muted-foreground">{order.handover?.method_label ?? "Hub drop-off"}</p>
                {order.handover?.method === "dispatch_pickup" ? (
                  <>
                    <p className="mt-1">{order.handover.pickup_address ?? "No address on file"}</p>
                    {order.handover.pickup_phone && <a href={`tel:${order.handover.pickup_phone}`} className="block font-medium text-primary">{order.handover.pickup_phone}</a>}
                    {order.handover.pickup_times && <p className="text-muted-foreground">Best times: {order.handover.pickup_times}</p>}
                  </>
                ) : (
                  <p className="mt-1 text-muted-foreground">Giver brings it to the hub ({[order.handover?.area, order.handover?.state].filter(Boolean).join(", ")}).</p>
                )}
                {order.giver?.email && <p className="truncate text-xs text-muted-foreground">{order.giver.email}</p>}
              </InfoCard>

              <InfoCard title={isPickup ? "2. Receiver collects at hub (free)" : "2. Deliver to receiver (receiver pays)"} icon={isPickup ? MapPin : Truck}>
                <p className="font-semibold">{order.recipient?.name ?? order.requester?.name ?? "—"}</p>
                {order.recipient?.phone && <a href={`tel:${order.recipient.phone}`} className="block font-medium text-primary">{order.recipient.phone}</a>}
                {order.recipient?.alt_phone && <p className="text-muted-foreground">Alt: {order.recipient.alt_phone}</p>}
                {order.recipient?.email && <p className="truncate text-xs text-muted-foreground">{order.recipient.email}</p>}
                {isPickup ? (
                  <p className="mt-1">{order.hub ?? "—"}</p>
                ) : (
                  <>
                    <p className="mt-1">{[order.recipient?.address, order.recipient?.city, order.state].filter(Boolean).join(", ") || "—"}</p>
                    {order.recipient?.landmark && <p className="text-muted-foreground">Near {order.recipient.landmark}</p>}
                    {order.recipient?.notes && <p className="text-muted-foreground">Note: {order.recipient.notes}</p>}
                  </>
                )}
                {order.recipient?.best_time && <p className="text-muted-foreground">Best time: {order.recipient.best_time}</p>}
              </InfoCard>
            </div>

            {!isPickup && (
              <div className="space-y-3 rounded-2xl border border-brand-yellow-300 bg-highlight-soft/40 p-4">
                <p className="text-sm font-semibold">
                  Delivery fee <span className="font-normal text-muted-foreground">· paid by the receiver ·{" "}
                    {typeof order.charges?.delivery === "number" ? `quoted ${formatNaira(order.charges.delivery)}${order.charges.delivery_fee_quoted_at ? ` ${timeAgo(order.charges.delivery_fee_quoted_at)}` : ""}` : "not quoted yet"}
                  </span>
                </p>
                {inProgress ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
                      <Field label="Amount (₦)">
                        <Input type="number" inputMode="decimal" min={0} step="50" value={fee} onChange={(event) => setFee(event.target.value)} placeholder="e.g. 3500" />
                      </Field>
                      <Field label="Note to the receiver (optional)">
                        <Input value={feeNote} onChange={(event) => setFeeNote(event.target.value)} maxLength={500} placeholder="e.g. Interstate dispatch via GIG, pay on delivery" />
                      </Field>
                      <Button onClick={() => run("delivery_fee")} disabled={!!busy}>
                        {busy === "delivery_fee" && <Loader2 className="size-4 animate-spin" />} {typeof order.charges?.delivery === "number" ? "Update fee" : "Save fee"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Quote the fee before dispatch. The receiver is notified privately and sees it on their order — it is never shown to the giver.</p>
                  </>
                ) : null}
              </div>
            )}

            {inProgress ? (
              <div className="space-y-3 rounded-2xl border border-border p-4">
                <p className="text-sm font-semibold">Update progress <span className="font-normal text-muted-foreground">· now: {order.fulfillment_stage_label ?? "—"}</span></p>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Field label="Stage">
                    <Select value={stage} onChange={(event) => setStage(event.target.value)}>
                      {availableStages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </Select>
                  </Field>
                  <Button onClick={() => run("stage")} disabled={!!busy || stage === order.fulfillment_stage}>
                    {busy === "stage" && <Loader2 className="size-4 animate-spin" />} Update stage
                  </Button>
                </div>
                <Field label="Note to the receiver (optional)" hint="Included in their notification and order chat.">
                  <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={500} placeholder="e.g. Ready on shelf B2 — bring your order number." />
                </Field>
                <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-3">
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => run("cancel")} disabled={!!busy}>
                    <XCircle className="size-4" /> Cancel order
                  </Button>
                  <Button variant="outline" onClick={() => run("complete")} disabled={!!busy}>
                    <PackageCheck className="size-4" /> Mark completed
                  </Button>
                </div>
              </div>
            ) : (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                This order is {REQUEST_STATUS_LABELS[order.status]?.toLowerCase() ?? order.status}{order.received_at ? ` — receipt confirmed ${timeAgo(order.received_at)}` : ""}.
                {order.stage_note ? ` Note: ${order.stage_note}` : ""}
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: typeof MapPin; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border p-4 text-sm">
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Icon className="size-4 text-primary" /> {title}</p>
      {children}
    </div>
  );
}
