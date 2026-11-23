"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Ban, ExternalLink, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAllStates } from "@/components/admin/geography-admin";
import { DataTable, Field, FilterSelect, PageHeader, Pagination, Pill, RowActions, SearchInput, TableCard, Toolbar, errorMessage, fieldErrors, useConfirm, useTableState, type PageMeta } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { profilePath } from "@/lib/site";

type Role = "member" | "moderator" | "admin";
type AdminUser = {
  id: number; slug: string; name: string; first_name: string | null; middle_name: string | null; last_name: string | null;
  email: string; avatar_url: string | null; role: Role; adult_confirmed: boolean;
  possible_duplicates: { id: number; name: string; slug: string | null; reason: string }[];
  email_verified: boolean; is_demo: boolean; suspended_at: string | null; suspension_reason: string | null;
  location: string | null; state_id: number | null; state: string | null; lga_id: number | null; lga: string | null; phone: string | null;
  listings_count: number; requests_count: number; created_at: string;
};
type Page = { data: AdminUser[]; meta: PageMeta };
type FormState = { id?: number; first_name: string; middle_name: string; last_name: string; email: string; password: string; role: Role; location: string; state_id: string; lga_id: string; phone: string; email_verified: boolean };
type StateOption = { id: number; name: string };

const ROLE_LABEL: Record<Role, string> = { member: "Member", moderator: "Moderator", admin: "Administrator" };

/**
 * Members ("customers") and staff accounts. `scope="staff"` shows administrators
 * and moderators. Admins can create, edit, suspend and delete accounts.
 */
export function AdminMembersPage({ scope }: { scope: "members" | "staff" }) {
  const { user: me } = useSession();
  const isAdmin = !!me?.is_admin;
  const queryClient = useQueryClient();
  const { confirm, element: confirmDialog } = useConfirm();
  const table = useTableState({ filter: scope === "staff" ? "staff" : "" }, 25);
  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", scope, table.query],
    queryFn: () => api.get<Page>("admin/users", table.query),
    placeholderData: (previous) => previous,
  });
  const { data: states } = useAllStates();

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

  const blank: FormState = { first_name: "", middle_name: "", last_name: "", email: "", password: "", role: scope === "staff" ? "moderator" : "member", location: "", state_id: "", lga_id: "", phone: "", email_verified: true };
  const title = scope === "staff" ? "Admins & moderators" : "Members";

  return (
    <div>
      <PageHeader
        title={title}
        description={scope === "staff" ? "People who run Gratis Castle. Administrators can change everything; moderators review listings and reports." : "Everyone who gives and receives on Gratis Castle."}
        actions={isAdmin && <Button onClick={() => setForm(blank)}><Plus className="size-4" /> {scope === "staff" ? "Add staff account" : "Add member"}</Button>}
      />

      <TableCard>
        <Toolbar>
          <SearchInput value={table.q} onChange={table.setQ} placeholder="Search name or email" />
          {scope === "members" && (
            <FilterSelect label="Filter" value={table.filters.filter} onChange={(value) => table.setFilter("filter", value)}>
              <option value="">Everyone</option>
              <option value="members">Members only</option>
              <option value="unverified">Unverified email</option>
              <option value="suspended">Suspended</option>
              <option value="duplicates">Possible duplicate accounts</option>
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
              <td className="text-muted-foreground">{member.state ?? "—"}{member.lga && <span className="block text-xs">{member.lga}</span>}</td>
              <td className="whitespace-nowrap text-muted-foreground">{member.listings_count} listed · {member.requests_count} requested</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {member.suspended_at ? <Pill tone="red">Suspended</Pill> : <Pill tone="green">Active</Pill>}
                  {!member.email_verified && <Pill>Unverified</Pill>}
                  {member.is_demo && <Pill>Demo</Pill>}
                  {member.possible_duplicates.length > 0 && (
                    <span title={`Shares an IP address with: ${member.possible_duplicates.map((other) => other.name).join(", ")}. Review before acting — families and offices can share a connection.`}>
                      <Pill tone="yellow">Possible duplicate ({member.possible_duplicates.length})</Pill>
                    </span>
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap text-muted-foreground">{timeAgo(member.created_at)}</td>
              <td>
                <RowActions items={[
                  { label: "View profile", icon: <ExternalLink className="size-4" />, onSelect: () => window.open(profilePath(member.slug), "_blank") },
                  {
                    label: "Edit", icon: <Pencil className="size-4" />, hidden: !isAdmin,
                    onSelect: () => setForm({ id: member.id, first_name: member.first_name ?? member.name.split(" ")[0] ?? "", middle_name: member.middle_name ?? "", last_name: member.last_name ?? "", email: member.email, password: "", role: member.role, location: member.location ?? "", state_id: member.state_id ? String(member.state_id) : "", lga_id: member.lga_id ? String(member.lga_id) : "", phone: member.phone ?? "", email_verified: member.email_verified }),
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
        {data && <Pagination meta={data.meta} onPage={table.setPage} onPerPage={table.setPerPage} />}
      </TableCard>

      <AccountDialog form={form} states={states ?? []} isSelf={form?.id === me?.id} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />
      {confirmDialog}
      {!isAdmin && <p className="mt-4 text-sm text-muted-foreground">Moderators can suspend members. Only administrators can create, edit or delete accounts. <Link href="/admin" className="text-primary">Back to dashboard</Link></p>}
    </div>
  );
}

function AccountDialog({ form, states, isSelf, onClose, onSaved }: { form: FormState | null; states: StateOption[]; isSelf: boolean; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<FormState | null>(null);
  const [openedFor, setOpenedFor] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: lgas, isFetching: loadingLgas } = useQuery({
    queryKey: ["lgas", draft?.state_id],
    queryFn: () => api.get<{ data: Array<{ id: number; name: string }> }>(`states/${draft?.state_id}/lgas`).then((response) => response.data),
    enabled: !!draft?.state_id,
    staleTime: 10 * 60_000,
  });

  if (form !== openedFor) {
    setOpenedFor(form);
    setDraft(form);
    setErrors({});
  }

  if (!draft) return <Dialog open={false} />;
  const set = (key: keyof FormState) => (event: { target: { value: string } }) => setDraft((current) => current && { ...current, [key]: event.target.value });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    const payload = {
      first_name: draft.first_name.trim(), middle_name: draft.middle_name.trim() || null, last_name: draft.last_name.trim(), email: draft.email, role: draft.role, location: draft.location || null,
      state_id: draft.state_id ? Number(draft.state_id) : null, lga_id: draft.state_id && draft.lga_id ? Number(draft.lga_id) : null, phone: draft.phone || null, email_verified: draft.email_verified,
      ...(draft.password ? { password: draft.password } : {}),
    };
    try {
      if (draft.id) await api.put(`admin/users/${draft.id}`, payload);
      else await api.post("admin/users", payload);
      toast.success(draft.id ? "Account saved" : "Account created");
      onSaved();
    } catch (err) {
      setErrors(fieldErrors(err));
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
            <Field label="First name" error={errors.first_name}><Input value={draft.first_name} onChange={set("first_name")} required minLength={2} maxLength={60} /></Field>
            <Field label="Middle name (optional)" error={errors.middle_name}><Input value={draft.middle_name} onChange={set("middle_name")} maxLength={60} /></Field>
            <Field label="Surname" error={errors.last_name}><Input value={draft.last_name} onChange={set("last_name")} required minLength={2} maxLength={60} /></Field>
            <Field label="Email" error={errors.email}><Input type="email" value={draft.email} onChange={set("email")} required maxLength={255} /></Field>
            <Field label={draft.id ? "New password (optional)" : "Password"} error={errors.password}><Input type="password" value={draft.password} onChange={set("password")} required={!draft.id} minLength={8} autoComplete="new-password" /></Field>
            <Field label="Role" hint={isSelf ? "You can't change your own role." : undefined}>
              <Select value={draft.role} onChange={set("role")} disabled={isSelf}>
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
            <Field label="State" error={errors.state_id}>
              <Select value={draft.state_id} onChange={(event) => setDraft((current) => current && { ...current, state_id: event.target.value, lga_id: "" })}>
                <option value="">Not set</option>
                {states.map((state) => <option key={state.id} value={state.id}>{state.name}</option>)}
              </Select>
            </Field>
            <Field label="LGA" error={errors.lga_id}>
              <Select value={draft.lga_id} onChange={set("lga_id")} disabled={!draft.state_id || loadingLgas}>
                <option value="">{!draft.state_id ? "Choose a state first" : loadingLgas ? "Loading…" : "Not set"}</option>
                {(lgas ?? []).map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </Select>
            </Field>
            <Field label="General area"><Input value={draft.location} onChange={set("location")} maxLength={120} placeholder="e.g. Yaba" /></Field>
            <Field label="Phone" hint="Nigerian mobile — one account per number." error={errors.phone}><Input type="tel" value={draft.phone} onChange={set("phone")} maxLength={32} placeholder="0803 123 4567" /></Field>
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
