"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Ban, CheckCircle2, ExternalLink, Eye, EyeOff, Mail, Pencil, Star, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, STATUS_TONE, SearchInput, TableCard, Toolbar,
  errorMessage, humanize, useConfirm, useTableState, type Paged,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, Textarea } from "@/components/ui/form-fields";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";

/* ---------------------------------- Reports --------------------------------- */

type AdminReport = {
  id: number; reason: string; details: string | null; status: string; resolution_note: string | null; created_at: string; resolved_at: string | null;
  reporter: { id: number; name: string; slug: string } | null; resolver: string | null;
  subject_type: "listing" | "member" | "conversation" | "deleted"; subject_label: string;
  user: { id: number; slug: string; suspended: boolean } | null; listing: { id: number; slug: string; title: string } | null;
};

const REASON_LABELS: Record<string, string> = {
  selling: "Selling", prohibited_item: "Prohibited item", misrepresented: "Misrepresented", harassment: "Harassment", scam: "Scam", other: "Other",
};

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const table = useTableState({ status: "open", reason: "", type: "" });
  const [handling, setHandling] = useState<AdminReport | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", table.query],
    queryFn: () => api.get<Paged<AdminReport> & { counts: { open: number } }>("admin/reports", table.query),
    placeholderData: (previous) => previous,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  async function suspend(report: AdminReport) {
    if (!report.user) return;
    try {
      await api.patch(`admin/users/${report.user.id}`, { suspended: true, suspension_reason: `Report #${report.id}: ${REASON_LABELS[report.reason] ?? report.reason}` });
      toast.success("Member suspended");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not suspend member"));
    }
  }

  return (
    <div>
      <PageHeader title="Reports" description="Safety concerns raised by members. Act first (edit or remove the listing, suspend the member), then resolve the report with a note." />
      <TableCard>
        <Toolbar>
          <FilterSelect label="Status" value={table.filters.status} onChange={(value) => table.setFilter("status", value)}>
            <option value="open">Needs action ({data?.counts.open ?? "…"})</option>
            <option value="closed">Closed</option>
            <option value="all">All reports</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </FilterSelect>
          <FilterSelect label="Reason" value={table.filters.reason} onChange={(value) => table.setFilter("reason", value)}>
            <option value="">Any reason</option>
            {Object.entries(REASON_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Reported" value={table.filters.type} onChange={(value) => table.setFilter("type", value)}>
            <option value="">Anything</option>
            <option value="listing">Listings</option>
            <option value="user">Members</option>
            <option value="conversation">Conversations</option>
          </FilterSelect>
        </Toolbar>
        <DataTable loading={isLoading} empty={!data?.data.length} emptyText="No reports here — all clear." minWidth={980} head={<tr><th>Reported</th><th>Reason</th><th>Reporter</th><th>Status</th><th>Received</th><th className="text-right">Actions</th></tr>}>
          {data?.data.map((report) => (
            <tr key={report.id}>
              <td className="max-w-80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{report.subject_type}</p>
                {report.listing ? (
                  <Link href={`/admin/listings/${report.listing.id}/edit`} className="font-semibold hover:text-primary">{report.listing.title}</Link>
                ) : report.user ? (
                  <Link href={profilePath(report.user.slug)} target="_blank" className="font-semibold hover:text-primary">{report.subject_label}</Link>
                ) : <span className="font-semibold">{report.subject_label}</span>}
                {report.details && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{report.details}</p>}
              </td>
              <td><Pill tone="yellow">{REASON_LABELS[report.reason] ?? humanize(report.reason)}</Pill></td>
              <td className="text-muted-foreground">{report.reporter ? <Link href={profilePath(report.reporter.slug)} target="_blank" className="hover:text-primary">{report.reporter.name}</Link> : "—"}</td>
              <td>
                <Pill tone={STATUS_TONE[report.status]}>{humanize(report.status)}</Pill>
                {report.resolver && <p className="mt-0.5 text-[11px] text-muted-foreground">by {report.resolver}</p>}
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(report.created_at)}</td>
              <td>
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant={report.status === "open" || report.status === "reviewed" ? "default" : "outline"} onClick={() => setHandling(report)}>
                    {report.status === "open" || report.status === "reviewed" ? "Handle" : "View"}
                  </Button>
                  <RowActions items={[
                    { label: "Open listing", icon: <ExternalLink className="size-4" />, hidden: !report.listing, onSelect: () => report.listing && window.open(listingPath(report.listing.slug), "_blank") },
                    { label: "Suspend member", icon: <Ban className="size-4" />, danger: true, hidden: !report.user || report.user.suspended, onSelect: () => void suspend(report) },
                  ]} />
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>
      <ReportDialog report={handling} onClose={() => setHandling(null)} onSaved={() => { setHandling(null); refresh(); }} />
    </div>
  );
}

function ReportDialog({ report, onClose, onSaved }: { report: AdminReport | null; onClose: () => void; onSaved: () => void }) {
  const [note, setNote] = useState("");
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  if (report && report.id !== openedFor) {
    setOpenedFor(report.id);
    setNote(report.resolution_note ?? "");
  }

  async function update(status: string) {
    if (!report) return;
    setBusy(true);
    try {
      await api.patch(`admin/reports/${report.id}`, { status, resolution_note: note.trim() || null });
      toast.success(`Report ${humanize(status).toLowerCase()}`);
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update report"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report #{report?.id}: {report ? REASON_LABELS[report.reason] ?? report.reason : ""}</DialogTitle>
          <DialogDescription>{report?.subject_label}</DialogDescription>
        </DialogHeader>
        {report && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl bg-muted px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground">From {report.reporter?.name ?? "a deleted member"} · {new Date(report.created_at).toLocaleString("en-NG")}</p>
              <p className="mt-1 whitespace-pre-line">{report.details || "No extra details given."}</p>
            </div>
            <Field label="Resolution note (staff only)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="What did you do? e.g. Removed listing and warned the member." /></Field>
            <div className="flex flex-wrap justify-end gap-2">
              {report.status !== "reviewed" && <Button variant="outline" disabled={busy} onClick={() => void update("reviewed")}><Eye className="size-4" /> Mark reviewed</Button>}
              <Button variant="ghost" disabled={busy} onClick={() => void update("dismissed")}><XCircle className="size-4" /> Dismiss</Button>
              <Button disabled={busy} onClick={() => void update("resolved")}><CheckCircle2 className="size-4" /> Resolve</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- Reviews --------------------------------- */

type AdminReview = {
  id: number; rating: number; comment: string | null; hidden: boolean; created_at: string;
  reviewer: { id: number; name: string; slug: string } | null; reviewed_user: { id: number; name: string; slug: string } | null;
  listing: { id: number; title: string; slug: string } | null;
};

export function AdminReviewsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ visibility: "", rating: "" });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", table.query],
    queryFn: () => api.get<Paged<AdminReview>>("admin/reviews", table.query),
    placeholderData: (previous) => previous,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });

  async function setHidden(review: AdminReview, hidden: boolean) {
    try {
      await api.patch(`admin/reviews/${review.id}`, { hidden });
      toast.success(hidden ? "Review hidden from the site" : "Review is visible again");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update review"));
    }
  }

  return (
    <div>
      <PageHeader title="Reviews" description="What receivers say about givers. Written reviews appear on the home page and member profiles — hide anything abusive or misleading." />
      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search comment or member" />
          <FilterSelect label="Visibility" value={table.filters.visibility} onChange={(value) => table.setFilter("visibility", value)}>
            <option value="">Visible and hidden</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </FilterSelect>
          <FilterSelect label="Rating" value={table.filters.rating} onChange={(value) => table.setFilter("rating", value)}>
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}
          </FilterSelect>
        </Toolbar>
        <DataTable loading={isLoading} empty={!data?.data.length} emptyText="No reviews match." minWidth={900} head={<tr><th>Review</th><th>From → To</th><th>Item</th><th>Status</th><th>Written</th><th className="w-10" /></tr>}>
          {data?.data.map((review) => (
            <tr key={review.id} className={review.hidden ? "bg-muted/30" : undefined}>
              <td className="max-w-96">
                <span className="flex items-center gap-0.5 text-brand-yellow-500" aria-label={`${review.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < review.rating ? "size-3.5 fill-current" : "size-3.5 text-muted-foreground/40"} />)}
                </span>
                <p className="mt-1 line-clamp-3 text-sm">{review.comment || <span className="text-muted-foreground">No comment</span>}</p>
              </td>
              <td className="text-sm">
                {review.reviewer ? <Link href={profilePath(review.reviewer.slug)} target="_blank" className="hover:text-primary">{review.reviewer.name}</Link> : "Deleted member"}
                <span className="text-muted-foreground"> → </span>
                {review.reviewed_user ? <Link href={profilePath(review.reviewed_user.slug)} target="_blank" className="hover:text-primary">{review.reviewed_user.name}</Link> : "Deleted member"}
              </td>
              <td className="max-w-56 truncate text-muted-foreground">{review.listing ? <Link href={`/admin/listings/${review.listing.id}/edit`} className="hover:text-primary">{review.listing.title}</Link> : "—"}</td>
              <td>{review.hidden ? <Pill>Hidden</Pill> : <Pill tone="green">Visible</Pill>}</td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(review.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: review.hidden ? "Show on site" : "Hide from site", icon: review.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />, onSelect: () => void setHidden(review, !review.hidden) },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                    onSelect: () => confirm({
                      title: "Delete this review?",
                      description: "It is removed permanently. Hiding it keeps a record instead.",
                      action: async () => {
                        try {
                          await api.delete(`admin/reviews/${review.id}`);
                          toast.success("Review deleted");
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete review"));
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
      {confirmDialog}
    </div>
  );
}

/* ------------------------------- Contact inbox ------------------------------ */

type ContactMessage = {
  id: number; name: string; email: string; topic: string; message: string; status: string; staff_note: string | null;
  user: { id: number; name: string; slug: string } | null; handled_by: string | null; handled_at: string | null; created_at: string;
};

const MESSAGE_STATUSES: Array<[string, string]> = [["new", "New"], ["in_progress", "In progress"], ["resolved", "Resolved"], ["spam", "Spam"]];
const TOPICS: Array<[string, string]> = [["general", "General"], ["safety", "Safety"], ["account", "Account"], ["partnership", "Partnership"], ["other", "Other"]];

export function AdminInboxPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ status: "open", topic: "" });
  const [open, setOpen] = useState<ContactMessage | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-inbox", table.query],
    queryFn: () => api.get<Paged<ContactMessage> & { counts: { new: number } }>("admin/contact-messages", table.query),
    placeholderData: (previous) => previous,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-inbox"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-counts"] });
  };

  return (
    <div>
      <PageHeader title="Contact inbox" description="Messages sent through the website's contact form. Reply by email, then mark each one resolved." />
      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search name, email or message" />
          <FilterSelect label="Status" value={table.filters.status} onChange={(value) => table.setFilter("status", value)}>
            <option value="open">Open ({data?.counts.new ?? "…"} new)</option>
            <option value="all">All messages</option>
            {MESSAGE_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect label="Topic" value={table.filters.topic} onChange={(value) => table.setFilter("topic", value)}>
            <option value="">Any topic</option>
            {TOPICS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </Toolbar>
        <DataTable loading={isLoading} empty={!data?.data.length} emptyText="No messages here." minWidth={860} head={<tr><th>From</th><th>Message</th><th>Topic</th><th>Status</th><th>Received</th><th className="w-10" /></tr>}>
          {data?.data.map((message) => (
            <tr key={message.id} className={message.status === "new" ? "font-semibold" : undefined}>
              <td><p>{message.name}</p><p className="text-xs font-normal text-muted-foreground">{message.email}</p></td>
              <td className="max-w-96"><button type="button" className="line-clamp-2 text-left font-normal hover:text-primary" onClick={() => setOpen(message)}>{message.message}</button></td>
              <td className="font-normal text-muted-foreground">{humanize(message.topic)}</td>
              <td><Pill tone={STATUS_TONE[message.status]}>{humanize(message.status)}</Pill></td>
              <td className="whitespace-nowrap font-normal text-muted-foreground">{timeAgo(message.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: "Open", icon: <Pencil className="size-4" />, onSelect: () => setOpen(message) },
                  { label: "Reply by email", icon: <Mail className="size-4" />, onSelect: () => window.open(`mailto:${message.email}?subject=${encodeURIComponent("Re: your message to Gratis Castle")}`) },
                  "separator",
                  {
                    label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                    onSelect: () => confirm({
                      title: `Delete the message from ${message.name}?`,
                      description: "This can't be undone.",
                      action: async () => {
                        try {
                          await api.delete(`admin/contact-messages/${message.id}`);
                          toast.success("Message deleted");
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete message"));
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
      <MessageDialog message={open} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); refresh(); }} />
      {confirmDialog}
    </div>
  );
}

function MessageDialog({ message, onClose, onSaved }: { message: ContactMessage | null; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState("in_progress");
  const [note, setNote] = useState("");
  const [openedFor, setOpenedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  if (message && message.id !== openedFor) {
    setOpenedFor(message.id);
    setStatus(message.status === "new" ? "in_progress" : message.status);
    setNote(message.staff_note ?? "");
  }

  async function save() {
    if (!message) return;
    setBusy(true);
    try {
      await api.patch(`admin/contact-messages/${message.id}`, { status, staff_note: note.trim() || null });
      toast.success("Message updated");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update message"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!message} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{message?.name}</DialogTitle>
          <DialogDescription>{message?.email} · {message ? humanize(message.topic) : ""} · {message ? new Date(message.created_at).toLocaleString("en-NG") : ""}</DialogDescription>
        </DialogHeader>
        {message && (
          <div className="space-y-4 text-sm">
            <p className="whitespace-pre-line rounded-xl bg-muted px-4 py-3 leading-relaxed">{message.message}</p>
            {message.user && <p className="text-xs text-muted-foreground">Sent while signed in as <Link href={profilePath(message.user.slug)} target="_blank" className="text-primary hover:underline">{message.user.name}</Link>.</p>}
            <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
              <Field label="Status">
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {MESSAGE_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </Field>
              <Field label="Staff note"><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Private — e.g. Replied 23 Nov." /></Field>
            </div>
            {message.handled_by && <p className="text-xs text-muted-foreground">Last updated by {message.handled_by}{message.handled_at ? ` ${timeAgo(message.handled_at)}` : ""}.</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild variant="outline"><a href={`mailto:${message.email}?subject=${encodeURIComponent("Re: your message to Gratis Castle")}`}><Mail className="size-4" /> Reply by email</a></Button>
              <Button onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
