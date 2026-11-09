"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Field, PageHeader, Panel, Pill, RowActions, errorMessage, humanize, useConfirm } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select, Textarea } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { CATEGORY_ICONS, categoryIcon, timeAgo } from "@/lib/gapcastle";

/* -------------------------------- Categories -------------------------------- */

type AdminCategory = { id: number; name: string; slug: string; description: string | null; icon: string; image_url: string | null; is_active: boolean; sort_order: number; listings_count: number };

export function AdminCategoriesPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: async () => (await api.get<{ data: AdminCategory[] }>("admin/categories")).data });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      const payload = { name: editing.name, description: editing.description || null, icon: editing.icon ?? "package", image_url: editing.image_url || null, sort_order: editing.sort_order ?? 0, is_active: editing.is_active ?? true };
      if (editing.id) await api.put(`admin/categories/${editing.id}`, payload);
      else await api.post("admin/categories", payload);
      toast.success("Category saved");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save category"));
    }
  }

  async function toggle(category: AdminCategory) {
    try {
      await api.put(`admin/categories/${category.id}`, { ...category, is_active: !category.is_active });
      toast.success(category.is_active ? `${category.name} hidden` : `${category.name} is visible`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update category"));
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="How items are organised across the marketplace. Hidden categories can't be chosen for new listings."
        actions={isAdmin && <Button onClick={() => setEditing({ is_active: true, icon: "package", sort_order: (data?.length ?? 0) + 1 })}><Plus className="size-4" /> New category</Button>}
      />
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <DataTable loading={isLoading} empty={!data?.length} minWidth={640} head={<tr><th>Category</th><th>Slug</th><th className="text-right">Listings</th><th className="text-right">Order</th><th>Visibility</th><th className="w-10" /></tr>}>
          {(data ?? []).map((category) => {
            const Icon = categoryIcon(category.icon);
            return (
              <tr key={category.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary"><Icon className="size-4" /></span>
                    <div className="min-w-0"><p className="font-semibold">{category.name}</p><p className="max-w-72 truncate text-xs text-muted-foreground">{category.description}</p></div>
                  </div>
                </td>
                <td className="text-muted-foreground">{category.slug}</td>
                <td className="text-right tabular-nums">{category.listings_count}</td>
                <td className="text-right tabular-nums">{category.sort_order}</td>
                <td>{category.is_active ? <Pill tone="green">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                <td>
                  <RowActions items={[
                    { label: "Edit", icon: <Pencil className="size-4" />, onSelect: () => setEditing(category), hidden: !isAdmin },
                    { label: category.is_active ? "Hide" : "Show", icon: category.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />, onSelect: () => void toggle(category), hidden: !isAdmin },
                    "separator",
                    {
                      label: "Delete", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin,
                      onSelect: () => confirm({
                        title: `Delete ${category.name}?`,
                        description: category.listings_count ? "This category still has listings, so it can't be deleted. Hide it instead, or move its listings first." : "This can't be undone.",
                        action: async () => {
                          try {
                            await api.delete(`admin/categories/${category.id}`);
                            toast.success("Category deleted");
                            refresh();
                          } catch (err) {
                            toast.error(errorMessage(err, "Could not delete category"));
                          }
                        },
                      }),
                    },
                  ]} />
                </td>
              </tr>
            );
          })}
        </DataTable>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle><DialogDescription>Categories appear in the header, home page and explore filters.</DialogDescription></DialogHeader>
          {editing && (
            <form onSubmit={save} className="space-y-4">
              <Field label="Name"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} required maxLength={60} /></Field>
              <Field label="Description"><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} maxLength={255} /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Icon">
                  <Select value={editing.icon ?? "package"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                    {Object.keys(CATEGORY_ICONS).map((icon) => <option key={icon} value={icon}>{humanize(icon.replace("-", " "))}</option>)}
                  </Select>
                </Field>
                <Field label="Display order"><Input type="number" min={0} value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Image URL (optional)"><Input type="url" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></Field>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v === true })} /> Visible to members</label>
              <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save category</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

/* ------------------------------- Announcements ------------------------------ */

type AdminAnnouncement = { id: number; title: string; body: string; is_active: boolean; published_at: string | null };

export function AdminAnnouncementsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const [form, setForm] = useState({ title: "", body: "", notify_members: false });
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["admin-announcements"], queryFn: async () => (await api.get<{ data: AdminAnnouncement[] }>("admin/announcements")).data });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    void queryClient.invalidateQueries({ queryKey: ["announcements"] });
  };

  async function publish(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post("admin/announcements", { ...form, is_active: true });
      toast.success(form.notify_members ? "Announcement published and members notified" : "Announcement published");
      setForm({ title: "", body: "", notify_members: false });
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not publish"));
    } finally {
      setBusy(false);
    }
  }

  async function update(item: AdminAnnouncement, changes: Partial<AdminAnnouncement>) {
    try {
      await api.put(`admin/announcements/${item.id}`, { title: item.title, body: item.body, is_active: item.is_active, ...changes });
      toast.success("Announcement updated");
      setEditing(null);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update"));
    }
  }

  return (
    <div>
      <PageHeader title="Announcements" description="The newest visible announcement appears on the home page. You can also email it to verified members." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <DataTable loading={isLoading} empty={!data?.length} minWidth={560} head={<tr><th>Announcement</th><th>Status</th><th>Published</th><th className="w-10" /></tr>}>
            {(data ?? []).map((item) => (
              <tr key={item.id}>
                <td><p className="font-semibold">{item.title}</p><p className="line-clamp-2 max-w-xl text-xs text-muted-foreground">{item.body}</p></td>
                <td>{item.is_active ? <Pill tone="green">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                <td className="whitespace-nowrap text-muted-foreground">{item.published_at ? timeAgo(item.published_at) : "—"}</td>
                <td>
                  <RowActions items={[
                    { label: "Edit", icon: <Pencil className="size-4" />, onSelect: () => setEditing(item), hidden: !isAdmin },
                    { label: item.is_active ? "Hide" : "Show", icon: item.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />, onSelect: () => void update(item, { is_active: !item.is_active }), hidden: !isAdmin },
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
        </div>

        {isAdmin && (
          <Panel title="New announcement" className="self-start">
            <form onSubmit={publish} className="space-y-4">
              <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={160} /></Field>
              <Field label="Message"><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required maxLength={3000} rows={5} /></Field>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.notify_members} onCheckedChange={(v) => setForm({ ...form, notify_members: v === true })} /> Also email all verified members</label>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Publishing…" : "Publish announcement"}</Button>
            </form>
          </Panel>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit announcement</DialogTitle><DialogDescription>Changes show on the site straight away.</DialogDescription></DialogHeader>
          {editing && (
            <form onSubmit={(event) => { event.preventDefault(); void update(editing, {}); }} className="space-y-4">
              <Field label="Title"><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} required maxLength={160} /></Field>
              <Field label="Message"><Textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} required maxLength={3000} rows={5} /></Field>
              <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

/* --------------------------------- Activity --------------------------------- */

type ActivityRow = { id: number; action: string; user: string | null; subject_type: string | null; subject_id: number | null; created_at: string };

export function AdminActivityPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-activity"], queryFn: async () => (await api.get<{ data: ActivityRow[] }>("admin/activity")).data, refetchInterval: 30_000 });
  return (
    <div>
      <PageHeader title="Activity log" description="The latest 100 actions across the community, refreshed every 30 seconds." />
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <DataTable loading={isLoading} empty={!data?.length} minWidth={600} head={<tr><th>Who</th><th>Action</th><th>Subject</th><th className="text-right">When</th></tr>}>
          {(data ?? []).map((row) => (
            <tr key={row.id}>
              <td className="font-semibold">{row.user ?? "System"}</td>
              <td className="text-muted-foreground">{humanize(row.action.replaceAll(".", " · "))}</td>
              <td className="text-muted-foreground">{row.subject_type ? `${row.subject_type} #${row.subject_id}` : "—"}</td>
              <td className="whitespace-nowrap text-right text-muted-foreground">{timeAgo(row.created_at)}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
