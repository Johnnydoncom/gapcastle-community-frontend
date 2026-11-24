"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable, EditorHeader, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, SearchInput, TableCard, Toolbar,
  errorMessage, fieldErrors, humanize, useConfirm, useTableState, type Paged,
} from "@/components/admin/ui";
import { RichTextContent, RichTextEditor } from "@/components/editor/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";

/* ------------------------------- Announcements ------------------------------ */

type AdminAnnouncement = { id: number; title: string; body: string; body_text: string; is_active: boolean; published_at: string | null; author: string | null; updated_at: string | null };
type AnnouncementDraft = { id?: number; title: string; body: string; is_active: boolean; notify_members: boolean };

const EMPTY_ANNOUNCEMENT: AnnouncementDraft = { title: "", body: "", is_active: true, notify_members: false };

export function AdminAnnouncementsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ visibility: "" });
  const [draft, setDraft] = useState<AnnouncementDraft>(EMPTY_ANNOUNCEMENT);
  const [editorKey, setEditorKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<AdminAnnouncement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-announcements", table.query],
    queryFn: () => api.get<Paged<AdminAnnouncement>>("admin/announcements", table.query),
    placeholderData: (previous) => previous,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    void queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  function edit(next: AnnouncementDraft) {
    setDraft(next);
    setErrors({});
    setEditorKey((key) => key + 1); // remount the editor with the new content
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (draft.id) {
        await api.put(`admin/announcements/${draft.id}`, { title: draft.title, body: draft.body, is_active: draft.is_active });
        toast.success("Announcement updated");
      } else {
        await api.post("admin/announcements", draft);
        toast.success(draft.notify_members ? "Announcement published and members notified" : "Announcement published");
      }
      edit(EMPTY_ANNOUNCEMENT);
      refresh();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save announcement"));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: AdminAnnouncement) {
    try {
      await api.put(`admin/announcements/${item.id}`, { title: item.title, body: item.body, is_active: !item.is_active });
      toast.success(item.is_active ? "Announcement hidden" : "Announcement is visible");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update"));
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" description="The newest visible announcement appears as a banner on the home page. You can also email it to verified members." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-6">
          {preview && (
            <section className="rounded-2xl border border-border bg-card shadow-soft">
              <EditorHeader title={preview.title} onClose={() => setPreview(null)} />
              <RichTextContent html={preview.body} className="p-5 text-sm" />
            </section>
          )}
          <TableCard>
            <Toolbar>
              <SearchInput value={table.q} onChange={table.setQ} placeholder="Search announcements" />
              <FilterSelect label="Visibility" value={table.filters.visibility} onChange={(value) => table.setFilter("visibility", value)}>
                <option value="">Visible and hidden</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </FilterSelect>
            </Toolbar>
            <DataTable loading={isLoading} empty={!data?.data.length} emptyText="No announcements yet." minWidth={600} head={<tr><th>Announcement</th><th>Status</th><th>Published</th><th className="w-10" /></tr>}>
              {data?.data.map((item) => (
                <tr key={item.id} className={draft.id === item.id ? "bg-primary-50/60" : undefined}>
                  <td>
                    <button type="button" className="text-left" onClick={() => setPreview(item)}>
                      <p className="font-semibold hover:text-primary">{item.title}</p>
                      <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground">{item.body_text}</p>
                    </button>
                  </td>
                  <td>{item.is_active ? <Pill tone="green">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                  <td className="whitespace-nowrap text-muted-foreground">{item.published_at ? timeAgo(item.published_at) : "—"}{item.author && <span className="block text-xs">by {item.author}</span>}</td>
                  <td>
                    <RowActions items={[
                      { label: "Preview", icon: <Eye className="size-4" />, onSelect: () => setPreview(item) },
                      { label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin, onSelect: () => edit({ id: item.id, title: item.title, body: item.body, is_active: item.is_active, notify_members: false }) },
                      { label: item.is_active ? "Hide" : "Show", icon: item.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />, hidden: !isAdmin, onSelect: () => void toggle(item) },
                      "separator",
                      {
                        label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                        onSelect: () => confirm({
                          title: `Delete “${item.title}”?`,
                          description: "It will disappear from the home page. Emails already sent can't be recalled.",
                          action: async () => {
                            try {
                              await api.delete(`admin/announcements/${item.id}`);
                              toast.success("Announcement deleted");
                              if (draft.id === item.id) edit(EMPTY_ANNOUNCEMENT);
                              refresh();
                            } catch (err) {
                              toast.error(errorMessage(err, "Could not delete"));
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
        </div>

        {isAdmin && (
          <section className="self-start rounded-2xl border border-border bg-card shadow-soft xl:sticky xl:top-20">
            <EditorHeader title={draft.id ? "Edit announcement" : "New announcement"} onClose={() => edit(EMPTY_ANNOUNCEMENT)} />
            <form onSubmit={save} className="space-y-4 p-5">
              <Field label="Title" error={errors.title}><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required maxLength={160} /></Field>
              <Field label="Message" hint="The home-page banner shows a one-line summary; emails and notifications use the full text." error={errors.body}>
                <RichTextEditor key={editorKey} value={draft.body} onChange={(html) => setDraft((current) => ({ ...current, body: html }))} placeholder="What's new?" maxLength={3000} invalid={!!errors.body} />
              </Field>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v === true })} /> Visible on the site</label>
              {!draft.id && <label className="flex items-center gap-2 text-sm"><Checkbox checked={draft.notify_members} onCheckedChange={(v) => setDraft({ ...draft, notify_members: v === true })} /> Also email all verified members</label>}
              <div className="flex gap-2">
                {draft.id && <Button type="button" variant="ghost" onClick={() => edit(EMPTY_ANNOUNCEMENT)}><Plus className="size-4" /> New instead</Button>}
                <Button type="submit" className="ml-auto" disabled={busy}>{busy ? "Saving…" : draft.id ? "Save changes" : "Publish announcement"}</Button>
              </div>
            </form>
          </section>
        )}
      </div>
      {confirmDialog}
    </div>
  );
}

/* --------------------------------- Activity --------------------------------- */

type ActivityRow = { id: number; action: string; user: string | null; subject_type: string | null; subject_id: number | null; properties: Record<string, unknown> | null; created_at: string };

const ACTIVITY_AREAS: Array<[string, string]> = [
  ["admin", "Admin changes"], ["listing", "Listings"], ["item_request", "Orders & claims"], ["report", "Reports"], ["user", "Member accounts"], ["contact", "Contact form"],
];

export function AdminActivityPage() {
  const table = useTableState({ area: "" }, 50);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-activity", table.query],
    queryFn: () => api.get<Paged<ActivityRow>>("admin/activity", table.query),
    placeholderData: (previous) => previous,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div>
      <PageHeader title="Activity log" description="Every important action across the community and the dashboard, newest first. Refreshes every 2 minutes." />
      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search action or person" />
          <FilterSelect label="Area" value={table.filters.area} onChange={(value) => table.setFilter("area", value)}>
            <option value="">All areas</option>
            {ACTIVITY_AREAS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
        </Toolbar>
        <DataTable loading={isLoading} empty={!data?.data.length} minWidth={720} head={<tr><th>Who</th><th>Action</th><th>Subject</th><th>Details</th><th className="text-right">When</th></tr>}>
          {data?.data.map((row) => (
            <tr key={row.id}>
              <td className="font-semibold">{row.user ?? "System"}</td>
              <td className="text-muted-foreground">{humanize(row.action.replaceAll(".", " · ").replaceAll("_", " "))}</td>
              <td className="text-muted-foreground">{row.subject_type ? `${row.subject_type} #${row.subject_id}` : "—"}</td>
              <td className="max-w-64 truncate text-xs text-muted-foreground" title={row.properties ? JSON.stringify(row.properties) : undefined}>
                {row.properties ? Object.entries(row.properties).map(([key, value]) => `${humanize(key)}: ${Array.isArray(value) ? value.join(", ") : String(value)}`).join(" · ") : "—"}
              </td>
              <td className="whitespace-nowrap text-right text-muted-foreground" title={new Date(row.created_at).toLocaleString("en-NG")}>{timeAgo(row.created_at)}</td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>
    </div>
  );
}
