"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useState, type FormEvent } from "react";
import { Ban, ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, SearchInput, Toolbar, errorMessage, useConfirm } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { profilePath } from "@/lib/site";
import type { NgState } from "@/lib/types";

type Role = "member" | "moderator" | "admin";
type AdminUser = {
  id: number; slug: string; name: string; email: string; avatar_url: string | null; role: Role;
  email_verified: boolean; is_demo: boolean; suspended_at: string | null; suspension_reason: string | null;
  location: string | null; state_id: number | null; state: string | null; phone: string | null;
  listings_count: number; requests_count: number; created_at: string;
};
type Page = { data: AdminUser[]; meta: { current_page: number; last_page: number; total: number } };
type FormState = { id?: number; name: string; email: string; password: string; role: Role; location: string; state_id: string; phone: string; email_verified: boolean };

const ROLE_LABEL: Record<Role, string> = { member: "Member", moderator: "Moderator", admin: "Administrator" };

/**
 * Members ("customers") and staff accounts. `scope="staff"` shows administrators
 * and moderators. Admins can create, edit, suspend and delete accounts.
 */
export function AdminMembersPage({ scope }: { scope: "members" | "staff" }) {
  const params = useSearchParams();
  const { user: me } = useSession();
  const isAdmin = !!me?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(scope === "staff" ? "staff" : params.get("filter") ?? "");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const search = useDeferredValue(q);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: () => api.get<Page>("admin/users", { q: search || undefined, filter: filter || undefined, page }),
    placeholderData: (previous) => previous,
  });
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => api.get<{ data: NgState[] }>("states").then((response) => response.data),
    staleTime: 5 * 60_000,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-users"] });

  async function setSuspended(member: AdminUser, suspended: boolean) {
    try {
      await api.patch(`admin/users/${member.id}`, { suspended, suspension_reason: suspended ? "Suspended by an administrator" : null });
      toast.success(suspended ? `${member.name} suspended` : `${member.name} reinstated`);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update member"));
    }
  }

  const blank: FormState = { name: "", email: "", password: "", role: scope === "staff" ? "moderator" : "member", location: "", state_id: "", phone: "", email_verified: true };
  const title = scope === "staff" ? "Admins & moderators" : "Members";

  return (
    <div>
      <PageHeader
        title={title}
        description={scope === "staff" ? "People who run Gratis Castle. Administrators can change everything; moderators review listings and reports." : "Everyone who gives and receives on Gratis Castle."}
        actions={isAdmin && <Button onClick={() => setForm(blank)}><Plus className="size-4" /> {scope === "staff" ? "Add staff account" : "Add member"}</Button>}
      />

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <Toolbar>
          <SearchInput value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search name or email" />
          {scope === "members" && (
            <FilterSelect label="Filter" value={filter} onChange={(value) => { setFilter(value); setPage(1); }}>
              <option value="">Everyone</option>
              <option value="members">Members only</option>
              <option value="unverified">Unverified email</option>
              <option value="suspended">Suspended</option>
            </FilterSelect>
          )}
        </Toolbar>

        <DataTable
          loading={isLoading}
          empty={!data?.data.length}
          minWidth={860}
          head={<tr><th>Name</th><th>Role</th><th>State</th><th>Activity</th><th>Status</th><th>Joined</th><th className="w-10" /></tr>}
        >
          {data?.data.map((member) => (
            <tr key={member.id} className={member.suspended_at ? "bg-destructive/5" : undefined}>
              <td>
                <div className="flex items-center gap-3">
                  <Avatar url={member.avatar_url} name={member.name} className="size-9" />
                  <div className="min-w-0">
                    <p className="font-semibold">{member.name}{member.id === me?.id && <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span>}</p>
                    <p className="max-w-56 truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </td>
              <td><Pill tone={member.role === "admin" ? "blue" : member.role === "moderator" ? "yellow" : "gray"}>{ROLE_LABEL[member.role]}</Pill></td>
              <td className="text-muted-foreground">{member.state ?? "—"}</td>
              <td className="whitespace-nowrap text-muted-foreground">{member.listings_count} listed · {member.requests_count} requested</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {member.suspended_at ? <Pill tone="red">Suspended</Pill> : <Pill tone="green">Active</Pill>}
                  {!member.email_verified && <Pill>Unverified</Pill>}
                  {member.is_demo && <Pill>Demo</Pill>}
                </div>
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(member.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: "View profile", icon: <ExternalLink className="size-4" />, onSelect: () => window.open(profilePath(member.slug), "_blank") },
                  {
                    label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin,
                    onSelect: () => setForm({ id: member.id, name: member.name, email: member.email, password: "", role: member.role, location: member.location ?? "", state_id: member.state_id ? String(member.state_id) : "", phone: member.phone ?? "", email_verified: member.email_verified }),
                  },
                  member.suspended_at
                    ? { label: "Reinstate", icon: <RotateCcw className="size-4" />, onSelect: () => void setSuspended(member, false), hidden: member.id === me?.id || (member.role === "admin" && !isAdmin) }
                    : { label: "Suspend", icon: <Ban className="size-4" />, onSelect: () => void setSuspended(member, true), hidden: member.id === me?.id || (member.role === "admin" && !isAdmin) },
                  "separator",
                  {
                    label: "Delete account", icon: <Trash2 className="size-4" />, danger: true, hidden: !isAdmin || member.id === me?.id,
                    onSelect: () => confirm({
                      title: `Delete ${member.name}'s account?`,
                      description: "Their listings, requests and messages are permanently removed. This cannot be undone — consider suspending instead.",
                      confirmLabel: "Delete account",
                      action: async () => {
                        try {
                          await api.delete(`admin/users/${member.id}`);
                          toast.success("Account deleted");
                          refresh();
                        } catch (err) {
                          toast.error(errorMessage(err, "Could not delete account"));
                        }
                      },
                    }),
                  },
                ]} />
              </td>
            </tr>
          ))}
        </DataTable>
        {data && <Pagination page={data.meta.current_page} lastPage={data.meta.last_page} total={data.meta.total} onPage={setPage} />}
      </div>

      <AccountDialog form={form} states={states ?? []} isSelf={form?.id === me?.id} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />
      {confirmDialog}
      {!isAdmin && <p className="mt-4 text-sm text-muted-foreground">Moderators can suspend members. Only administrators can create, edit or delete accounts. <Link href="/admin" className="text-primary">Back to dashboard</Link></p>}
    </div>
  );
}

function AccountDialog({ form, states, isSelf, onClose, onSaved }: { form: FormState | null; states: NgState[]; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<FormState | null>(null);
  const [openedFor, setOpenedFor] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  if (form !== openedFor) {
    setOpenedFor(form);
    setDraft(form);
  }

  if (!draft) return <Dialog open={false} />;
  const set = (key: keyof FormState) => (event: { target: { value: string } }) => setDraft((current) => current && { ...current, [key]: event.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    const payload = {
      name: draft.name, email: draft.email, role: draft.role, location: draft.location || null,
      state_id: draft.state_id ? Number(draft.state_id) : null, phone: draft.phone || null, email_verified: draft.email_verified,
      ...(draft.password ? { password: draft.password } : {}),
    };
    try {
      if (draft.id) await api.put(`admin/users/${draft.id}`, payload);
      else await api.post("admin/users", payload);
      toast.success(draft.id ? "Account saved" : "Account created");
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Could not save account"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!form} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit account" : "Create account"}</DialogTitle>
          <DialogDescription>{draft.id ? "Leave the password blank to keep the current one." : "The new member can sign in straight away with this password."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={draft.name} onChange={set("name")} required minLength={2} maxLength={80} /></Field>
            <Field label="Email"><Input type="email" value={draft.email} onChange={set("email")} required maxLength={255} /></Field>
            <Field label={draft.id ? "New password (optional)" : "Password"}><Input type="password" value={draft.password} onChange={set("password")} required={!draft.id} minLength={8} autoComplete="new-password" /></Field>
            <Field label="Role" hint={isSelf ? "You can't change your own role." : undefined}>
              <Select value={draft.role} onChange={set("role")} disabled={isSelf}>
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
            <Field label="State">
              <Select value={draft.state_id} onChange={set("state_id")}>
                <option value="">Not set</option>
                {[...states].sort((a, b) => a.name.localeCompare(b.name)).map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </Select>
            </Field>
            <Field label="General area"><Input value={draft.location} onChange={set("location")} maxLength={120} placeholder="e.g. Yaba" /></Field>
            <Field label="Phone"><Input type="tel" value={draft.phone} onChange={set("phone")} maxLength={32} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={draft.email_verified} onCheckedChange={(checked) => setDraft((current) => current && { ...current, email_verified: checked === true })} />
            Email address is verified
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : draft.id ? "Save account" : "Create account"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
