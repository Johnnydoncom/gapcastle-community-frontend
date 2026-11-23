"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { Field, PageHeader, Panel, errorMessage, fieldErrors } from "@/components/admin/ui";
import { Input, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import type { SiteInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Mode = "manual" | "automatic";
type Settings = { listing_approval: Mode; monthly_claim_limit: number; pending_listings: number; updated_at: string | null; updated_by: string | null; site: SiteInfo };

const CONTACT_FIELDS: Array<{ key: keyof SiteInfo; label: string; type?: string; placeholder?: string; hint?: string }> = [
  { key: "contact_email", label: "Contact email", type: "email", placeholder: "info@gapcastle.com", hint: "Shown on the site, and where contact-form messages are emailed." },
  { key: "contact_phone", label: "Phone number", type: "tel", placeholder: "+234 …" },
  { key: "whatsapp_number", label: "WhatsApp number", type: "tel", placeholder: "+234 803 123 4567", hint: "Leave blank to hide the WhatsApp link." },
  { key: "support_hours", label: "Support hours", placeholder: "Mon–Sat, 9am–5pm" },
  { key: "office_address", label: "Office address", placeholder: "Optional" },
];

const SOCIAL_FIELDS: Array<{ key: keyof SiteInfo; label: string }> = [
  { key: "social_facebook", label: "Facebook" },
  { key: "social_instagram", label: "Instagram" },
  { key: "social_x", label: "X (Twitter)" },
  { key: "social_linkedin", label: "LinkedIn" },
  { key: "social_tiktok", label: "TikTok" },
  { key: "social_youtube", label: "YouTube" },
];

const OPTIONS: Array<{ value: Mode; title: string; text: string; icon: typeof ShieldCheck; recommended?: boolean }> = [
  {
    value: "manual",
    title: "Manual approval",
    text: "New listings stay hidden until an admin or moderator reviews and approves them. Givers are told their listing is waiting for review.",
    icon: ShieldCheck,
    recommended: true,
  },
  {
    value: "automatic",
    title: "Automatic approval",
    text: "New listings are published straight away. Moderators can still pause or remove anything later from Listings.",
    icon: Zap,
  },
];

/** Admin › Settings. Listing approval defaults to manual; only administrators can change it. */
export function AdminSettingsPage() {
  const { user } = useSession();
  const isAdmin = !!user?.is_admin;
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<Mode | null>(null);
  const [limit, setLimit] = useState<string | null>(null);
  const [site, setSite] = useState<Partial<SiteInfo>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<{ data: Settings }>("admin/settings").then((response) => response.data),
  });

  const current = data?.listing_approval ?? "manual";
  const selected = choice ?? current;
  const currentLimit = String(data?.monthly_claim_limit ?? 3);
  const selectedLimit = limit ?? currentLimit;
  const limitValid = /^\d+$/.test(selectedLimit) && Number(selectedLimit) >= 1 && Number(selectedLimit) <= 50;
  const siteValue = (key: keyof SiteInfo) => site[key] ?? data?.site?.[key] ?? "";
  const siteDirty = Object.entries(site).some(([key, value]) => value !== (data?.site?.[key as keyof SiteInfo] ?? ""));
  const dirty = selected !== current || selectedLimit !== currentLimit || siteDirty;

  async function save() {
    setSaving(true);
    try {
      const response = await api.put<{ data: Settings; message: string }>("admin/settings", {
        listing_approval: selected,
        monthly_claim_limit: Number(selectedLimit),
        ...(siteDirty ? { site } : {}),
      });
      queryClient.setQueryData(["admin-settings"], response.data);
      setChoice(null);
      setLimit(null);
      setSite({});
      setErrors({});
      toast.success(response.message);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl pb-20">
      <PageHeader title="Settings" description="Control how the marketplace behaves. Changes apply immediately to everyone." />

      <Panel
        title="Listing approval"
        description="Decide whether new listings need a review before members can see them."
        actions={data?.updated_at ? <span className="text-xs text-muted-foreground">Changed {timeAgo(data.updated_at)}{data.updated_by ? ` by ${data.updated_by}` : ""}</span> : undefined}
      >
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : (
          <div role="radiogroup" aria-label="Listing approval" className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((option) => {
              const active = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!isAdmin}
                  onClick={() => setChoice(option.value)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-colors disabled:cursor-not-allowed",
                    active ? "border-primary bg-primary-50/60" : "border-border hover:border-primary-200",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn("flex size-10 items-center justify-center rounded-xl", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <option.icon className="size-5" />
                    </span>
                    <span className={cn("flex size-6 items-center justify-center rounded-full border-2", active ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                      {active && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                  </div>
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-bold">
                      {option.title}
                      {option.recommended && <span className="rounded-full bg-highlight-soft px-2 py-0.5 text-[11px] font-bold text-highlight-soft-foreground">Default · recommended</span>}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{option.text}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {data && data.pending_listings > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-highlight-soft px-4 py-3 text-sm text-highlight-soft-foreground">
            <span><strong>{data.pending_listings}</strong> listing{data.pending_listings === 1 ? " is" : "s are"} waiting for review. Switching to automatic won&apos;t publish them — approve them from the queue.</span>
            <Link href="/admin/listings?moderation=pending" className="inline-flex items-center gap-1 font-semibold">Review queue <ArrowRight className="size-4" /></Link>
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">Listings created by admins and moderators are always published straight away.</p>
      </Panel>

      <Panel className="mt-5" title="Monthly claim limit" description="How many free items each member can check out per calendar month. Cancelled orders don't count.">
        <div className="flex flex-wrap items-end gap-4">
          <label className="space-y-1.5">
            <span className="text-sm font-medium">Items per member, per month</span>
            <Input type="number" inputMode="numeric" min={1} max={50} value={selectedLimit} onChange={(event) => setLimit(event.target.value)} disabled={!isAdmin || isLoading} className="w-32" aria-invalid={!limitValid} />
          </label>
          <p className="max-w-md pb-2 text-sm text-muted-foreground">The terms of service say <strong className="text-foreground">3 items per month</strong>. If you change this, update the terms too.</p>
        </div>
        {!limitValid && <p className="mt-2 text-xs font-medium text-destructive">Choose a whole number from 1 to 50.</p>}
      </Panel>

      <Panel className="mt-5" title="Contact details" description="Shown in the site footer and on the Contact page.">
        <fieldset disabled={!isAdmin || isLoading} className="grid gap-4 sm:grid-cols-2">
          {CONTACT_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint} error={errors[`site.${field.key}`]} className={field.key === "office_address" ? "sm:col-span-2" : undefined}>
              <Input type={field.type ?? "text"} value={siteValue(field.key)} onChange={(event) => setSite((draft) => ({ ...draft, [field.key]: event.target.value }))} placeholder={field.placeholder} maxLength={255} />
            </Field>
          ))}
          <Field label="Footer description" hint="The short paragraph under the logo in the footer." error={errors["site.footer_about"]} className="sm:col-span-2">
            <Textarea value={siteValue("footer_about")} onChange={(event) => setSite((draft) => ({ ...draft, footer_about: event.target.value }))} rows={2} maxLength={400} />
          </Field>
        </fieldset>
      </Panel>

      <Panel className="mt-5" title="Social profiles" description="Full https:// links. Leave a field blank to hide that network from the footer.">
        <fieldset disabled={!isAdmin || isLoading} className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} error={errors[`site.${field.key}`]}>
              <Input type="url" value={siteValue(field.key)} onChange={(event) => setSite((draft) => ({ ...draft, [field.key]: event.target.value }))} placeholder="https://" maxLength={255} />
            </Field>
          ))}
        </fieldset>
      </Panel>

      <div className="sticky bottom-0 z-10 -mx-4 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {isAdmin ? (
          <div className="flex gap-2">
            {dirty && <Button variant="ghost" onClick={() => { setChoice(null); setLimit(null); setSite({}); setErrors({}); }} disabled={saving}>Cancel</Button>}
            <Button onClick={() => void save()} disabled={!dirty || saving || !limitValid}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Only administrators can change settings.</p>
        )}
      </div>
    </div>
  );
}
