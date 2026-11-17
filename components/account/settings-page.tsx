"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SESSION_KEY, useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import type { Account, NgState } from "@/lib/types";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

const NOTIFICATION_OPTIONS = [
  { key: "email_requests", label: "Requests", hint: "When someone requests your item, or a giver responds to your request." },
  { key: "email_messages", label: "Messages", hint: "When you receive a new message (at most every 10 minutes per chat)." },
  { key: "email_listing_updates", label: "Listing updates", hint: "Moderation decisions and delivery updates." },
  { key: "email_community", label: "Community news", hint: "Occasional announcements from the Gratis Castle team." },
];

export function SettingsPage() {
  const { user } = useSession();
  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <PageHeading eyebrow="Profile settings" title="Your account" description="Manage how neighbours see you and how we keep in touch." />
      <Tabs defaultValue="profile">
        <TabsList className="mb-6 flex h-auto flex-wrap justify-start gap-1 bg-muted p-1">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy &amp; safety</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileForm user={user} /></TabsContent>
        <TabsContent value="notifications"><NotificationForm user={user} /></TabsContent>
        <TabsContent value="security"><PasswordForm /></TabsContent>
        <TabsContent value="privacy"><PrivacySection /></TabsContent>
      </Tabs>
    </div>
  );
}

function useAccountUpdate() {
  const queryClient = useQueryClient();
  return (account: Account) => {
    queryClient.setQueryData(SESSION_KEY, (previous: { user: Account } | null | undefined) => (previous ? { ...previous, user: account } : previous));
  };
}

function ProfileForm({ user }: { user: Account }) {
  const updateAccount = useAccountUpdate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? "",
    location: user.location ?? "",
    state_id: user.state?.id ? String(user.state.id) : "",
    phone: user.phone ?? "",
    contact_preference: user.contact_preference,
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: () => api.get<{ data: NgState[] }>("states").then((response) => response.data),
    staleTime: 5 * 60_000,
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api.patch<{ data: Account; message: string }>("me/profile", {
        ...form,
        bio: form.bio || null,
        location: form.location || null,
        state_id: form.state_id ? Number(form.state_id) : null,
        phone: form.phone || null,
      });
      updateAccount(response.data);
      toast.success(response.message);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your profile"));
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please choose an image under 2 MB");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("avatar", file);
      const response = await api.post<{ data: Account; message: string }>("me/avatar", body);
      updateAccount(response.data);
      toast.success(response.message);
    } catch (err) {
      toast.error(errorMessage(err, "Could not upload photo"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar url={user.avatar_url} name={user.name} className="size-20 text-xl" />
          <button type="button" onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 rounded-full bg-primary p-2 text-primary-foreground shadow-soft" aria-label="Change profile photo">
            <Camera className="size-3.5" />
          </button>
        </div>
        <div>
          <p className="font-semibold">Profile photo</p>
          <p className="text-sm text-muted-foreground">{uploading ? "Uploading…" : "JPG, PNG or WebP, up to 2 MB."}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => uploadAvatar(e.target.files?.[0])} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Full name</Label>
          <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-location">General area</Label>
          <Input id="s-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Yaba, Lagos" maxLength={120} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="s-state">State</Label>
          <Select id="s-state" value={form.state_id} onChange={(e) => setForm({ ...form, state_id: e.target.value })}>
            <option value="">Choose your state…</option>
            {states?.map((state) => <option key={state.id} value={state.id}>{state.name}{state.pickup_available ? " — pickup hubs" : ""}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground">Used to show you the pickup hubs in your state when you request items.</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="s-bio">Bio</Label>
        <Textarea id="s-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} placeholder="A sentence or two about you" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s-phone">Phone (private)</Label>
          <Input id="s-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" />
          <p className="text-xs text-muted-foreground">{user.phone ? (user.phone_verified ? "Verified" : "Not verified yet") : "Never shown publicly."}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-contact">Preferred contact</Label>
          <Select id="s-contact" value={form.contact_preference} onChange={(e) => setForm({ ...form, contact_preference: e.target.value as Account["contact_preference"] })}>
            <option value="in_app">In-app messages</option>
            <option value="email">Email</option>
            <option value="phone">Phone (shared only after you choose to)</option>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Your email ({user.email}) and phone are never shown on your public profile.</p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

function NotificationForm({ user }: { user: Account }) {
  const updateAccount = useAccountUpdate();
  const [prefs, setPrefs] = useState(user.notification_preferences);

  async function toggle(key: string, value: boolean) {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    try {
      const response = await api.patch<{ data: Account }>("me/preferences", { notification_preferences: { [key]: value } });
      updateAccount(response.data);
    } catch {
      setPrefs(previous);
      toast.error("Could not save your preference");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="font-semibold">Email notifications</p>
      <p className="mt-1 text-sm text-muted-foreground">In-app notifications are always on. Choose what we also email you about.</p>
      <ul className="mt-5 divide-y divide-border">
        {NOTIFICATION_OPTIONS.map((option) => (
          <li key={option.key} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.hint}</p>
            </div>
            <Switch checked={!!prefs[option.key]} onCheckedChange={(value) => toggle(option.key, value)} aria-label={`Email me about ${option.label.toLowerCase()}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await api.patch<{ message: string }>("me/password", form);
      toast.success(response.message);
      setForm({ current_password: "", password: "", password_confirmation: "" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not update password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="font-semibold">Change password</p>
      <div className="space-y-1.5">
        <Label htmlFor="p-current">Current password</Label>
        <Input id="p-current" type="password" autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-new">New password</Label>
          <Input id="p-new" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-confirm">Confirm new password</Label>
          <Input id="p-confirm" type="password" autoComplete="new-password" minLength={8} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">At least 8 characters with letters and numbers. Other devices will be signed out.</p>
      <Button type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
    </form>
  );
}

function PrivacySection() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { data: blocks } = useQuery({
    queryKey: ["blocks"],
    queryFn: async () => (await api.get<{ data: { id: number; name: string; avatar_url: string | null }[] }>("me/blocks")).data,
  });

  async function unblock(id: number) {
    try {
      const response = await api.delete<{ message: string }>(`users/${id}/block`);
      toast.success(response.message);
      void queryClient.invalidateQueries({ queryKey: ["blocks"] });
    } catch {
      toast.error("Could not unblock this member");
    }
  }

  async function deleteAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!confirm("Permanently delete your account, listings and messages? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete("me", { password });
      queryClient.clear();
      toast.success("Your account has been deleted.");
      router.replace("/");
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete your account"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <p className="font-semibold">Blocked members</p>
        <p className="mt-1 text-sm text-muted-foreground">Blocked members can&apos;t message you or request your items.</p>
        {blocks?.length ? (
          <ul className="mt-4 divide-y divide-border">
            {blocks.map((member) => (
              <li key={member.id} className="flex items-center gap-3 py-3">
                <Avatar url={member.avatar_url} name={member.name} className="size-8" />
                <span className="flex-1 text-sm font-medium">{member.name}</span>
                <Button size="sm" variant="outline" onClick={() => unblock(member.id)}>Unblock</Button>
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>}
      </div>
      <form onSubmit={deleteAccount} className="space-y-4 rounded-2xl border border-destructive/30 bg-card p-6">
        <p className="font-semibold text-destructive">Delete account</p>
        <p className="text-sm text-muted-foreground">This permanently removes your profile, listings and conversations. Open requests on your items will be declined.</p>
        <div className="space-y-1.5">
          <Label htmlFor="del-password">Confirm with your password</Label>
          <Input id="del-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <Button type="submit" variant="destructive" disabled={deleting || !password}>{deleting ? "Deleting…" : "Delete my account"}</Button>
      </form>
    </div>
  );
}
