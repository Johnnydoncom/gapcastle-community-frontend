"use client";
import Image from "next/image";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, Info, Loader2, MapPin, MessageCircle, Package, Phone, Send, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { ApiError, api } from "@/lib/api";
import type { ItemRequest, NgState } from "@/lib/types";
import { cn } from "@/lib/utils";

type Summary = {
  id: number;
  title: string;
  path: string;
  image: string | null;
  place: string;
  condition: string;
  giverName: string;
};

type Method = "pickup" | "delivery";
type Errors = Record<string, string | undefined>;

/**
 * Request checkout. Nigeria only: the receiver picks their state; if it has an
 * active Gap Castle pickup hub they can collect there, otherwise pickup is
 * disabled and waybill/delivery is offered. Submits through the Next.js API
 * route proxy (/api/backend) — no server actions.
 */
export function RequestCheckout({
  listing,
  states,
  defaultStateId,
  defaultPhone,
}: {
  listing: Summary;
  states: NgState[];
  defaultStateId: number | null;
  defaultPhone: string;
}) {
  const sortedStates = useMemo(
    () => [...states].sort((a, b) => Number(b.pickup_available) - Number(a.pickup_available) || a.name.localeCompare(b.name)),
    [states],
  );
  const initialState = states.find((state) => state.id === defaultStateId) ?? null;

  const [stateId, setStateId] = useState<number | null>(initialState?.id ?? null);
  const [method, setMethod] = useState<Method | null>(initialState ? (initialState.pickup_available ? "pickup" : "delivery") : null);
  const [hubId, setHubId] = useState<number | null>(initialState?.pickup_available ? initialState.pickup_locations[0]?.id ?? null : null);
  const [phone, setPhone] = useState(defaultPhone);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [reason, setReason] = useState("");
  const [arrangement, setArrangement] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<ItemRequest | null>(null);

  const state = states.find((item) => item.id === stateId) ?? null;
  const hubs = state?.pickup_available ? state.pickup_locations : [];
  const hub = hubs.find((item) => item.id === hubId) ?? null;

  function chooseState(value: string) {
    const next = states.find((item) => item.id === Number(value)) ?? null;
    setStateId(next?.id ?? null);
    setMethod(next ? (next.pickup_available ? "pickup" : "delivery") : null);
    setHubId(next?.pickup_available ? next.pickup_locations[0]?.id ?? null : null);
    setErrors((current) => ({ ...current, state_id: undefined, fulfillment_method: undefined, pickup_location_id: undefined }));
  }

  function validate(): Errors {
    const found: Errors = {};
    if (!stateId) found.state_id = "Please choose your state.";
    if (!method) found.fulfillment_method = "Please choose how you'll receive the item.";
    if (method === "pickup" && !hubId) found.pickup_location_id = "Please choose a pickup hub.";
    if (!/^(\+?234|0)[789]\d{9}$/.test(phone.replace(/[\s\-()]/g, ""))) found.recipient_phone = "Please enter a valid Nigerian phone number, e.g. 0803 123 4567.";
    if (method === "delivery" && city.trim().length < 2) found.delivery_city = "Please add your city or LGA.";
    if (method === "delivery" && address.trim().length < 10) found.delivery_address = "Please add the delivery address for the waybill.";
    if (introduction.trim().length < 10) found.introduction = "Please write a short introduction (at least 10 characters).";
    return found;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setBusy(true);
    try {
      const response = await api.post<{ data: ItemRequest }>(`listings/${listing.id}/requests`, {
        introduction: introduction.trim(),
        reason: reason.trim() || null,
        state_id: stateId,
        fulfillment_method: method,
        pickup_location_id: method === "pickup" ? hubId : null,
        recipient_phone: phone,
        delivery_city: method === "delivery" ? city.trim() : null,
        delivery_address: method === "delivery" ? address.trim() : null,
        preferred_arrangement: arrangement.trim() || null,
      });
      setSent(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([key, messages]) => [key, messages[0]])));
        toast.error("Please check the highlighted fields");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not send your request");
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <SuccessScreen listing={listing} request={sent} hubName={hub?.name ?? null} />;
  }

  const collectionLabel = method === "pickup" ? (hub ? `${hub.name}, ${hub.area}` : "Pickup hub") : method === "delivery" ? "Waybill / delivery" : "Not chosen yet";

  return (
    <form onSubmit={submit} noValidate className="container-page pb-32 pt-4 sm:pb-12 sm:pt-6">
      <Link href={listing.path} className="mb-3 hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-primary sm:inline-flex">
        <ArrowLeft className="size-4" /> Back to item
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Request this item</h1>
      <p className="mt-1 text-sm text-muted-foreground">It&apos;s free — always. Tell {listing.giverName} a little about you and how you&apos;d like to receive it.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-4">
          <ItemSummary listing={listing} className="lg:hidden" />

          <Step number={1} title="Where are you?" done={!!state}>
            <div id="field-state_id" className="space-y-1.5">
              <Label htmlFor="state">Your state</Label>
              <Select id="state" value={stateId ?? ""} onChange={(event) => chooseState(event.target.value)} aria-invalid={!!errors.state_id} className="h-12 text-base sm:text-sm">
                <option value="" disabled>Choose your state…</option>
                <optgroup label="States with pickup hubs">
                  {sortedStates.filter((item) => item.pickup_available).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
                <optgroup label="Other states — waybill delivery">
                  {sortedStates.filter((item) => !item.pickup_available).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              </Select>
              <FieldError message={errors.state_id} />
              <p className="text-xs text-muted-foreground">We only serve Nigeria. We&apos;ll remember your state for next time.</p>
            </div>
          </Step>

          <Step number={2} title="How will you receive it?" done={!!method && (method === "delivery" || !!hubId)} disabled={!state}>
            <div id="field-fulfillment_method" role="radiogroup" aria-label="Collection method" className="grid gap-3 sm:grid-cols-2">
              <MethodCard
                selected={method === "pickup"}
                disabled={!state?.pickup_available}
                onSelect={() => { setMethod("pickup"); setHubId(hubs[0]?.id ?? null); }}
                icon={MapPin}
                title="Pickup hub"
                text={state?.pickup_available ? `Collect free from a Gap Castle hub in ${state.name}.` : state ? `No pickup hub in ${state.name} yet.` : "Choose your state first."}
              />
              <MethodCard
                selected={method === "delivery"}
                disabled={!state}
                onSelect={() => setMethod("delivery")}
                icon={Truck}
                title="Waybill / delivery"
                text="Sent to you anywhere in Nigeria. Any waybill cost is separate."
              />
            </div>
            <FieldError message={errors.fulfillment_method} />

            {method === "pickup" && hubs.length > 0 && (
              <div id="field-pickup_location_id" className="mt-4 space-y-2.5">
                <p className="text-sm font-semibold">Choose a hub in {state?.name}</p>
                {hubs.map((item) => (
                  <label key={item.id} className={cn("flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition-colors", hubId === item.id ? "border-primary bg-primary-50/60" : "border-border hover:border-primary-200")}>
                    <input type="radio" name="hub" value={item.id} checked={hubId === item.id} onChange={() => setHubId(item.id)} className="sr-only" />
                    <RadioDot checked={hubId === item.id} />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-bold">{item.name}</span>
                      <span className="mt-0.5 block text-muted-foreground">{item.address}, {item.area}</span>
                      {item.landmark && <span className="block text-xs text-muted-foreground">Landmark: {item.landmark}</span>}
                      <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.opening_hours && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {item.opening_hours}</span>}
                        {item.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3.5" /> {item.phone}</span>}
                      </span>
                    </span>
                  </label>
                ))}
                <FieldError message={errors.pickup_location_id} />
              </div>
            )}

            {method === "delivery" && (
              <div className="mt-4 space-y-4">
                {state && !state.pickup_available && (
                  <p className="flex gap-2 rounded-xl bg-muted px-3.5 py-3 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                    There&apos;s no Gap Castle pickup hub in {state.name} yet, so this item will come to you by waybill.
                  </p>
                )}
                <div id="field-delivery_city" className="space-y-1.5">
                  <Label htmlFor="city">City / LGA</Label>
                  <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Port Harcourt" maxLength={120} autoComplete="address-level2" aria-invalid={!!errors.delivery_city} className="h-12 text-base sm:text-sm" />
                  <FieldError message={errors.delivery_city} />
                </div>
                <div id="field-delivery_address" className="space-y-1.5">
                  <Label htmlFor="address">Delivery address or waybill park</Label>
                  <Textarea id="address" value={address} onChange={(event) => setAddress(event.target.value)} rows={3} maxLength={500} autoComplete="street-address" placeholder="Street, area and a nearby landmark — or the motor park where you'll collect the waybill" aria-invalid={!!errors.delivery_address} className="text-base sm:text-sm" />
                  <FieldError message={errors.delivery_address} />
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5 text-success" /> Private — only the Gap Castle team sees this, never the giver.</p>
                </div>
              </div>
            )}
          </Step>

          <Step number={3} title="Your contact number" done={phone.replace(/\D/g, "").length >= 11}>
            <div id="field-recipient_phone" className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="0803 123 4567" aria-invalid={!!errors.recipient_phone} className="h-12 pl-10 text-base sm:text-sm" />
              </div>
              <FieldError message={errors.recipient_phone} />
              <p className="text-xs text-muted-foreground">Used by the Gap Castle hub or courier to reach you. Never shown to the giver.</p>
            </div>
          </Step>

          <Step number={4} title={`Say hello to ${listing.giverName}`} done={introduction.trim().length >= 10}>
            <div className="space-y-4">
              <div id="field-introduction" className="space-y-1.5">
                <Label htmlFor="intro">A short introduction</Label>
                <Textarea id="intro" value={introduction} onChange={(event) => setIntroduction(event.target.value)} rows={3} maxLength={1000} placeholder="Hi! I'm a student in Yaba and this would really help me…" aria-invalid={!!errors.introduction} className="text-base sm:text-sm" />
                <div className="flex justify-between gap-2"><FieldError message={errors.introduction} /><span className="ml-auto text-xs text-muted-foreground">{introduction.length}/1000</span></div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reason">Why you&apos;d like it <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={1000} placeholder="Share as much or as little as you like" className="min-h-16 text-base sm:text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="arrangement">Best time to collect <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="arrangement" value={arrangement} onChange={(event) => setArrangement(event.target.value)} maxLength={500} placeholder="e.g. Weekday afternoons" className="h-12 text-base sm:text-sm" />
              </div>
            </div>
          </Step>
        </div>

        {/* Summary */}
        <aside className="hidden lg:sticky lg:top-36 lg:block">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <ItemSummary listing={listing} plain />
            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <Row label="Item" value={<span className="font-extrabold text-primary">Free</span>} />
              <Row label="State" value={state?.name ?? "—"} />
              <Row label="Collection" value={collectionLabel} />
              {method === "delivery" && <Row label="Waybill cost" value="Agreed separately" muted />}
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-highlight-soft px-4 py-3 text-highlight-soft-foreground">
              <span className="text-sm font-semibold">You pay for the item</span>
              <span className="text-xl font-extrabold">₦0</span>
            </div>
            <Button type="submit" size="lg" className="mt-4 h-13 w-full rounded-xl text-base" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-4" />} {busy ? "Sending…" : "Send request"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">The giver chooses who receives. You can cancel any time before collection.</p>
          </div>
        </aside>
      </div>

      {/* Phone: sticky submit bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur lg:hidden">
        <div className="container-page flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-lg font-extrabold text-primary">Free</p>
            <p className="truncate text-xs text-muted-foreground">{collectionLabel}</p>
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-xl px-6 text-base" disabled={busy}>
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-4" />} {busy ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Step({ number, title, done, disabled = false, children }: { number: number; title: string; done: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card p-4 transition-opacity sm:p-6", disabled && "pointer-events-none opacity-55")} inert={disabled}>
      <h2 className="mb-4 flex items-center gap-3 text-base font-bold sm:text-lg">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors", done ? "bg-success text-white" : "bg-primary-50 text-primary")}>
          {done ? <Check className="size-4" strokeWidth={3} /> : number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function MethodCard({ selected, disabled, onSelect, icon: Icon, title, text }: { selected: boolean; disabled: boolean; onSelect: () => void; icon: typeof MapPin; title: string; text: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-[border-color,background-color,transform] active:scale-[0.98]",
        selected ? "border-primary bg-primary-50/60" : "border-border hover:border-primary-200",
        disabled && "cursor-not-allowed border-dashed opacity-60 hover:border-border active:scale-100",
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 font-bold">{title} <RadioDot checked={selected} /></span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{text}</span>
      </span>
    </button>
  );
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden="true" className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", checked ? "border-primary" : "border-input")}>
      {checked && <span className="size-2.5 rounded-full bg-primary" />}
    </span>
  );
}

function ItemSummary({ listing, className, plain = false }: { listing: Summary; className?: string; plain?: boolean }) {
  return (
    <Link href={listing.path} className={cn("flex items-center gap-3", !plain && "rounded-3xl border border-border bg-card p-3", className)}>
      <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-muted sm:size-20">
        {listing.image ? (
          <Image src={listing.image} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <Package className="absolute inset-0 m-auto size-7 text-primary-300" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="rounded bg-highlight px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-highlight-foreground">FREE</span>
        <span className="mt-1 line-clamp-2 block font-bold leading-snug">{listing.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{listing.condition} · {listing.place}</span>
      </span>
    </Link>
  );
}

function Row({ label, value, muted = false }: { label: string; value: ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-semibold", muted && "font-normal text-muted-foreground")}>{value}</dd>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="text-xs font-medium text-destructive">{message}</p>;
}

function SuccessScreen({ listing, request, hubName }: { listing: Summary; request: ItemRequest; hubName: string | null }) {
  const steps = [
    { title: "Request sent", text: `${listing.giverName} has been notified.`, done: true },
    { title: "Giver reviews", text: "They choose who receives the item.", done: false },
    { title: request.fulfillment_method === "pickup" ? "Collect at the hub" : "Waybill on its way", text: request.fulfillment_method === "pickup" ? `We'll confirm when it's ready at ${hubName ?? "your hub"}.` : "The Gap Castle team arranges the waybill and shows you any cost first.", done: false },
  ];

  return (
    <div className="container-page flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-20 animate-fade-up items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-11" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">Request sent!</h1>
        <p className="mt-2 text-muted-foreground">You asked for <strong className="text-foreground">{listing.title}</strong>. We&apos;ll let you know as soon as {listing.giverName} responds.</p>

        <ol className="mt-8 space-y-3 text-left">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", step.done ? "bg-success text-white" : "bg-primary-50 text-primary")}>
                {step.done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <span><span className="block font-bold">{step.title}</span><span className="text-sm text-muted-foreground">{step.text}</span></span>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
          {request.conversation_id ? (
            <Button asChild size="lg"><Link href={`/account/messages?conversationId=${request.conversation_id}`}><MessageCircle className="size-4" /> Open chat</Link></Button>
          ) : (
            <Button asChild size="lg"><Link href="/account/requests">View my requests</Link></Button>
          )}
          <Button asChild size="lg" variant="outline"><Link href="/explore">Keep exploring</Link></Button>
        </div>
      </div>
    </div>
  );
}
