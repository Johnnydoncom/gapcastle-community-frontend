"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Check, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, errorMessage } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { cn } from "@/lib/utils";

type Mode = "manual" | "automatic";
type Settings = { listing_approval: Mode; pending_listings: number; updated_at: string | null; updated_by: string | null };

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
  const [saving, setSaving] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.get<{ data: Settings }>("admin/settings").then((response) => response.data),
  });

  const current = data?.listing_approval ?? "manual";
  const selected = choice ?? current;
  const dirty = selected !== current;

  async function save() {
    setSaving(true);
    try {
      const response = await api.put<{ data: Settings; message: string }>("admin/settings", { listing_approval: selected });
      queryClient.setQueryData(["admin-settings"], response.data);
      setChoice(null);
      toast.success(response.message);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save settings"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">Listings created by admins and moderators are always published straight away.</p>
          {isAdmin ? (
            <div className="flex gap-2">
              {dirty && <Button variant="ghost" onClick={() => setChoice(null)} disabled={saving}>Cancel</Button>}
              <Button onClick={() => void save()} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Only administrators can change settings.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
