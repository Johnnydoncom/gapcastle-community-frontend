"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { ChevronDown, Loader2, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label, Select } from "@/components/ui/form-fields";
import { api } from "@/lib/api";
import type { NgState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Lga = { id: number; name: string; slug: string };

/**
 * "Near you in Ikeja, Lagos ▾" — lets the visitor set the area used for "near me".
 * Either the browser's location (converted to the nearest LGA on the server and
 * immediately discarded) or a state/LGA from the list. Stored in a first-party cookie.
 */
export function AreaPicker({ label, isGuess, className }: { label: string; isGuess: boolean; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const { data: states } = useQuery({
    queryKey: ["states"],
    queryFn: async () => (await api.get<{ data: NgState[] }>("states")).data,
    staleTime: 5 * 60_000,
    enabled: open,
  });
  const { data: lgas, isFetching: loadingLgas } = useQuery({
    queryKey: ["lgas", stateId],
    queryFn: async () => (await api.get<{ data: Lga[] }>(`states/${stateId}/lgas`)).data,
    staleTime: 60 * 60_000,
    enabled: open && !!stateId,
  });

  async function save(body: Record<string, unknown>) {
    const response = await fetch("/api/location", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message ?? "Could not set your area");
    toast.success(`Showing items near ${payload.data.label}`);
    setOpen(false);
    startRefresh(() => router.refresh());
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser can't share a location. Please choose your area from the list.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        save({ lat: position.coords.latitude, lng: position.coords.longitude })
          .catch((error: Error) => toast.error(error.message))
          .finally(() => setLocating(false));
      },
      () => {
        setLocating(false);
        toast.error("We couldn't get your location. Please choose your area from the list.");
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 },
    );
  }

  async function saveChoice() {
    const state = states?.find((item) => String(item.id) === stateId);
    const lga = lgas?.find((item) => String(item.id) === lgaId);
    if (!state) return;
    setSaving(true);
    try {
      await save({ state_id: state.id, lga_id: lga?.id ?? null, label: [lga?.name, state.name.replace(" (FCT)", "")].filter(Boolean).join(", ") });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not set your area");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:border-primary-200 hover:bg-primary-50",
          className,
        )}
        aria-label={`Change your area (currently ${label})`}
      >
        {refreshing ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <MapPin className="size-4 shrink-0" />}
        <span className="truncate">{isGuess ? `${label} · change` : label}</span>
        <ChevronDown className="size-4 shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Where are you?</DialogTitle>
            <DialogDescription>We&apos;ll show free items closest to you first. Only your area is used — never your address.</DialogDescription>
          </DialogHeader>

          <Button type="button" variant="outline" size="lg" className="w-full justify-center" onClick={locateMe} disabled={locating}>
            {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            {locating ? "Finding your area…" : "Use my current location"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or choose <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="area-state">State</Label>
              <Select id="area-state" value={stateId} onChange={(event) => { setStateId(event.target.value); setLgaId(""); }} className="h-11">
                <option value="">Choose a state…</option>
                {[...(states ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((state) => (
                  <option key={state.id} value={state.id}>{state.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area-lga">LGA <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Select id="area-lga" value={lgaId} onChange={(event) => setLgaId(event.target.value)} disabled={!stateId || loadingLgas} className="h-11">
                <option value="">{loadingLgas ? "Loading…" : "Whole state"}</option>
                {(lgas ?? []).map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
              </Select>
            </div>
          </div>

          <Button type="button" size="lg" className="w-full" onClick={saveChoice} disabled={!stateId || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} Show items near me
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
