"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, Info, Loader2, Lock, MapPin, Package, Phone, Receipt, ShieldAlert, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { ApiError, api } from "@/lib/api";
import { NO_HIDDEN_FEE, SAFETY_NOTICE } from "@/lib/content";
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

type Defaults = {
  name: string;
  email: string;
  phone: string;
  stateId: number | null;
  safetyAcknowledged: boolean;
  claimsThisMonth: number;
  monthlyLimit: number;
};

type Method = "pickup" | "delivery";
type Errors = Record<string, string | undefined>;

const PHONE_PATTERN = /^(\+?234|0)[789][01]\d{8}$/;
const normalisePhone = (value: string) => value.replace(/[\s\-().]/g, "");

/**
 * The free checkout. Works like a normal e-commerce checkout — contact details,
 * pickup or delivery, review and agree — except the item and the delivery cost ₦0.
 * There is no approval step: placing the order claims the item. Nigeria only;
 * pickup is offered at Gratis Castle hubs in the member's state.
 */
export function RequestCheckout({ listing, states, defaults }: { listing: Summary; states: NgState[]; defaults: Defaults }) {
  const sortedStates = useMemo(
    () => [...states].sort((a, b) => Number(b.pickup_available) - Number(a.pickup_available) || a.name.localeCompare(b.name)),
    [states],
  );
  const initialState = states.find((state) => state.id === defaults.stateId) ?? null;

  const [stateId, setStateId] = useState<number | null>(initialState?.id ?? null);
  const [method, setMethod] = useState<Method | null>(initialState ? (initialState.pickup_available ? "pickup" : "delivery") : null);
  const [hubId, setHubId] = useState<number | null>(initialState?.pickup_available ? initialState.pickup_locations[0]?.id ?? null : null);
  const [contact, setContact] = useState({ name: defaults.name, email: defaults.email, phone: defaults.phone, altPhone: "" });
  const [address, setAddress] = useState({ street: "", city: "", landmark: "", notes: "" });
  const [bestTime, setBestTime] = useState("");
  const [message, setMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(defaults.safetyAcknowledged);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<ItemRequest | null>(null);

  const state = states.find((item) => item.id === stateId) ?? null;
  const hubs = state?.pickup_available ? state.pickup_locations : [];
  const hub = hubs.find((item) => item.id === hubId) ?? null;
  const remaining = Math.max(0, defaults.monthlyLimit - defaults.claimsThisMonth);

  function clearError(...keys: string[]) {
    setErrors((current) => ({ ...current, ...Object.fromEntries(keys.map((key) => [key, undefined])) }));
  }

  function chooseState(value: string) {
    const next = states.find((item) => item.id === Number(value)) ?? null;
    setStateId(next?.id ?? null);
    setMethod(next ? (next.pickup_available ? "pickup" : "delivery") : null);
    setHubId(next?.pickup_available ? next.pickup_locations[0]?.id ?? null : null);
    clearError("state_id", "fulfillment_method", "pickup_location_id");
  }

  function validate(): Errors {
    const found: Errors = {};
    if (contact.name.trim().length < 3) found.recipient_name = "Please enter the receiver's full name.";
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) found.recipient_email = "Please enter a valid email address for order updates.";
    if (!PHONE_PATTERN.test(normalisePhone(contact.phone))) found.recipient_phone = "Please enter a valid Nigerian mobile number, e.g. 0803 123 4567.";
    if (contact.altPhone.trim() && !PHONE_PATTERN.test(normalisePhone(contact.altPhone))) found.recipient_alt_phone = "Please enter a valid Nigerian mobile number, or leave it blank.";
    if (!stateId) found.state_id = "Please choose your state.";
    if (!method) found.fulfillment_method = "Please choose pickup or delivery.";
    if (method === "pickup" && !hubId) found.pickup_location_id = "Please choose a pickup hub.";
    if (method === "delivery" && address.street.trim().length < 10) found.delivery_address = "Please add your full delivery address (house number, street and area).";
    if (method === "delivery" && address.city.trim().length < 2) found.delivery_city = "Please add your city or LGA.";
    if (!safetyAcknowledged) found.safety_acknowledged = "Please read and acknowledge the safety notice.";
    if (!termsAccepted) found.terms_accepted = "Please accept the terms to place your order.";
    return found;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please check the highlighted fields");
      return;
    }

    setBusy(true);
    try {
      const response = await api.post<{ data: ItemRequest; message: string }>(`listings/${listing.id}/requests`, {
        recipient_name: contact.name.trim(),
        recipient_email: contact.email.trim(),
        recipient_phone: contact.phone,
        recipient_alt_phone: contact.altPhone.trim() || null,
        state_id: stateId,
        fulfillment_method: method,
        pickup_location_id: method === "pickup" ? hubId : null,
        delivery_address: method === "delivery" ? address.street.trim() : null,
        delivery_city: method === "delivery" ? address.city.trim() : null,
        delivery_landmark: method === "delivery" ? address.landmark.trim() || null : null,
        delivery_notes: method === "delivery" ? address.notes.trim() || null : null,
        preferred_arrangement: bestTime.trim() || null,
        introduction: message.trim() || null,
        terms_accepted: termsAccepted,
        safety_acknowledged: safetyAcknowledged,
      });
      setOrder(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errors).length) {
        setErrors(Object.fromEntries(Object.entries(err.errors).map(([key, messages]) => [key, messages[0]])));
        toast.error("Please check the highlighted fields");
      } else {
        toast.error(err instanceof Error ? err.message : "Could not place your order");
      }
    } finally {
      setBusy(false);
    }
  }

  if (order) {
    return <OrderConfirmation listing={listing} order={order} hubName={hub ? `${hub.name}, ${hub.area}` : null} />;
  }

  const collectionLabel = method === "pickup" ? (hub ? `${hub.name}, ${hub.area}` : "Pickup hub") : method === "delivery" ? "Free delivery" : "Not chosen yet";
  const contactDone = contact.name.trim().length >= 3 && PHONE_PATTERN.test(normalisePhone(contact.phone)) && /^\S+@\S+\.\S+$/.test(contact.email);
  const collectionDone = !!method && (method === "delivery" ? address.street.trim().length >= 10 && address.city.trim().length >= 2 : !!hubId);

  return (
    <form onSubmit={submit} noValidate className="container-page pb-36 pt-4 sm:pb-12 sm:pt-6">
      <Link href={listing.path} className="mb-3 hidden items-center gap-1.5 text-sm text-muted-foreground hover:text-primary sm:inline-flex">
        <ArrowLeft className="size-4" /> Back to item
      </Link>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Checkout</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The item is free and so is delivery. Once you place your order, it&apos;s yours — no waiting for approval.{" "}
        <span className="font-semibold text-foreground">{remaining} of {defaults.monthlyLimit}</span> free items left for you this month.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-4">
          <ItemSummary listing={listing} className="lg:hidden" />

          <Step number={1} title="Contact details" done={contactDone}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="recipient_name" label="Full name of receiver" error={errors.recipient_name} className="sm:col-span-2">
                <Input id="field-recipient_name" value={contact.name} onChange={(e) => { setContact({ ...contact, name: e.target.value }); clearError("recipient_name"); }} autoComplete="name" maxLength={120} placeholder="First and last name" aria-invalid={!!errors.recipient_name} className="h-12 text-base sm:text-sm" />
              </Field>
              <Field id="recipient_email" label="Email address" error={errors.recipient_email}>
                <Input id="field-recipient_email" type="email" inputMode="email" value={contact.email} onChange={(e) => { setContact({ ...contact, email: e.target.value }); clearError("recipient_email"); }} autoComplete="email" maxLength={200} aria-invalid={!!errors.recipient_email} className="h-12 text-base sm:text-sm" />
              </Field>
              <Field id="recipient_phone" label="Phone number" error={errors.recipient_phone}>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="field-recipient_phone" type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => { setContact({ ...contact, phone: e.target.value }); clearError("recipient_phone"); }} placeholder="0803 123 4567" aria-invalid={!!errors.recipient_phone} className="h-12 pl-10 text-base sm:text-sm" />
                </div>
              </Field>
              <Field id="recipient_alt_phone" label="Alternative phone" optional error={errors.recipient_alt_phone}>
                <Input id="field-recipient_alt_phone" type="tel" inputMode="tel" value={contact.altPhone} onChange={(e) => { setContact({ ...contact, altPhone: e.target.value }); clearError("recipient_alt_phone"); }} placeholder="Another number we can reach you on" className="h-12 text-base sm:text-sm" />
              </Field>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3.5 text-success" /> Private — only the Gratis Castle team sees these details, never the giver.</p>
          </Step>

          <Step number={2} title="Pickup or delivery" done={collectionDone}>
            <Field id="state_id" label="Your state" error={errors.state_id}>
              <Select id="field-state_id" value={stateId ?? ""} onChange={(event) => chooseState(event.target.value)} aria-invalid={!!errors.state_id} className="h-12 text-base sm:text-sm">
                <option value="" disabled>Choose your state…</option>
                <optgroup label="With a Gratis Castle pickup hub">
                  {sortedStates.filter((item) => item.pickup_available).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
                <optgroup label="Other states — free delivery">
                  {sortedStates.filter((item) => !item.pickup_available).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              </Select>
            </Field>

            <div id="field-fulfillment_method" role="radiogroup" aria-label="Pickup or delivery" className="mt-4 grid gap-3 sm:grid-cols-2">
              <MethodCard
                selected={method === "pickup"}
                disabled={!state?.pickup_available}
                onSelect={() => { setMethod("pickup"); setHubId(hubs[0]?.id ?? null); clearError("fulfillment_method"); }}
                icon={MapPin}
                title="Pick up at our hub"
                badge="₦0"
                text={state?.pickup_available ? `Collect from a Gratis Castle hub in ${state.name}.` : state ? `No pickup hub in ${state.name} yet.` : "Choose your state first."}
              />
              <MethodCard
                selected={method === "delivery"}
                disabled={!state}
                onSelect={() => { setMethod("delivery"); clearError("fulfillment_method"); }}
                icon={Truck}
                title="Deliver to me"
                badge="Free"
                text="Delivered to your address anywhere in Nigeria at no cost."
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
                    There&apos;s no Gratis Castle pickup hub in {state.name} yet, so we&apos;ll deliver to you — free of charge.
                  </p>
                )}
                <Field id="delivery_address" label="Delivery address" error={errors.delivery_address}>
                  <Textarea id="field-delivery_address" value={address.street} onChange={(e) => { setAddress({ ...address, street: e.target.value }); clearError("delivery_address"); }} rows={2} maxLength={500} autoComplete="street-address" placeholder="House number, street and area" aria-invalid={!!errors.delivery_address} className="text-base sm:text-sm" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="delivery_city" label="City / LGA" error={errors.delivery_city}>
                    <Input id="field-delivery_city" value={address.city} onChange={(e) => { setAddress({ ...address, city: e.target.value }); clearError("delivery_city"); }} maxLength={120} autoComplete="address-level2" placeholder="e.g. Port Harcourt" aria-invalid={!!errors.delivery_city} className="h-12 text-base sm:text-sm" />
                  </Field>
                  <Field id="delivery_landmark" label="Nearest landmark" optional>
                    <Input id="field-delivery_landmark" value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} maxLength={160} placeholder="e.g. Opposite the First Bank" className="h-12 text-base sm:text-sm" />
                  </Field>
                </div>
                <Field id="delivery_notes" label="Delivery instructions" optional>
                  <Input id="field-delivery_notes" value={address.notes} onChange={(e) => setAddress({ ...address, notes: e.target.value })} maxLength={500} placeholder="e.g. Call when you reach the estate gate" className="h-12 text-base sm:text-sm" />
                </Field>
              </div>
            )}
          </Step>

          <Step number={3} title="A few extras" optional done={false}>
            <div className="space-y-4">
              <Field id="preferred_arrangement" label="Best time to reach you" optional>
                <Input id="field-preferred_arrangement" value={bestTime} onChange={(e) => setBestTime(e.target.value)} maxLength={500} placeholder="e.g. Weekdays after 4pm" className="h-12 text-base sm:text-sm" />
              </Field>
              <Field id="introduction" label={`A thank-you note to ${listing.giverName}`} optional>
                <Textarea id="field-introduction" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} maxLength={1000} placeholder="Givers love hearing how their item will be used." className="text-base sm:text-sm" />
              </Field>
            </div>
          </Step>

          <Step number={4} title="Review and agree" done={termsAccepted && safetyAcknowledged}>
            <div className="space-y-3">
              {!defaults.safetyAcknowledged && <SafetyNotice />}
              {!defaults.safetyAcknowledged && (
                <Agreement id="field-safety_acknowledged" checked={safetyAcknowledged} onChange={(value) => { setSafetyAcknowledged(value); clearError("safety_acknowledged"); }} error={errors.safety_acknowledged}>
                  I have read the safety notice. I will never pay anyone to reserve, release or deliver an item.
                </Agreement>
              )}
              <Agreement id="field-terms_accepted" checked={termsAccepted} onChange={(value) => { setTermsAccepted(value); clearError("terms_accepted"); }} error={errors.terms_accepted}>
                I am 18 or older and agree to the <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">terms</Link> and{" "}
                <Link href="/community-guidelines" target="_blank" className="font-semibold text-primary hover:underline">community guidelines</Link>. I understand each member can get up to {defaults.monthlyLimit} items a month.
              </Agreement>
            </div>
          </Step>
        </div>

        {/* Order summary */}
        <aside className="hidden lg:sticky lg:top-36 lg:block">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order summary</p>
            <ItemSummary listing={listing} plain className="mt-3" />
            <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
              <Row label="Item" value="₦0" />
              <Row label={method === "pickup" ? "Hub pickup" : "Delivery"} value="₦0" />
              <Row label="Collection" value={collectionLabel} muted />
              <Row label="State" value={state?.name ?? "—"} muted />
            </dl>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-highlight-soft px-4 py-3 text-highlight-soft-foreground">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-extrabold">₦0</span>
            </div>
            <Button type="submit" size="lg" className="mt-4 h-13 w-full rounded-xl text-base" disabled={busy}>
              {busy ? <Loader2 className="size-5 animate-spin" /> : <Receipt className="size-4" />} {busy ? "Placing order…" : "Place free order"}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-success"><ShieldCheck className="size-3.5" /> {NO_HIDDEN_FEE}</p>
          </div>
        </aside>
      </div>

      {/* Phone: sticky order bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur lg:hidden">
        <div className="container-page flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-lg font-extrabold text-primary">Total ₦0</p>
            <p className="truncate text-xs text-muted-foreground">{collectionLabel} · {NO_HIDDEN_FEE}</p>
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-xl px-5 text-base" disabled={busy}>
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Receipt className="size-4" />} {busy ? "Placing…" : "Place order"}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** The reviewer-supplied "Stay safe while sharing" notice, shown before a member's first order. */
export function SafetyNotice() {
  return (
    <div className="rounded-2xl border border-brand-yellow-300 bg-highlight-soft p-4 text-highlight-soft-foreground sm:p-5">
      <p className="flex items-center gap-2 font-extrabold"><ShieldAlert className="size-5" /> {SAFETY_NOTICE.title}</p>
      <p className="mt-2 text-sm opacity-90">{SAFETY_NOTICE.intro}</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
        {SAFETY_NOTICE.points.map((point) => <li key={point}>{point}</li>)}
      </ol>
      <p className="mt-3 text-xs opacity-80">{SAFETY_NOTICE.outro}</p>
    </div>
  );
}

function Step({ number, title, done, optional = false, children }: { number: number; title: string; done: boolean; optional?: boolean; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-base font-bold sm:text-lg">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors", done ? "bg-success text-white" : "bg-primary-50 text-primary")}>
          {done ? <Check className="size-4" strokeWidth={3} /> : number}
        </span>
        {title}
        {optional && <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
      </h2>
      {children}
    </section>
  );
}

function Field({ id, label, optional = false, error, className, children }: { id: string; label: string; optional?: boolean; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`field-${id}`}>{label}{optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function Agreement({ id, checked, onChange, error, children }: { id: string; checked: boolean; onChange: (value: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div id={id}>
      <label className={cn("flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors", checked ? "border-success/40 bg-success-soft/40" : error ? "border-destructive/60" : "border-border")}>
        <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} className="mt-0.5" />
        <span className="text-muted-foreground">{children}</span>
      </label>
      <FieldError message={error} />
    </div>
  );
}

function MethodCard({ selected, disabled, onSelect, icon: Icon, title, badge, text }: { selected: boolean; disabled: boolean; onSelect: () => void; icon: typeof MapPin; title: string; badge: string; text: string }) {
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
        <span className="flex items-center justify-between gap-2 font-bold">{title} <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-[11px] font-extrabold text-success">{badge}</span></span>
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
        {listing.image ? <Image src={listing.image} alt="" fill sizes="80px" className="object-cover" /> : <Package className="absolute inset-0 m-auto size-7 text-primary-300" />}
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

function OrderConfirmation({ listing, order, hubName }: { listing: Summary; order: ItemRequest; hubName: string | null }) {
  const isPickup = order.fulfillment_method === "pickup";
  const next = [
    { title: "Order confirmed", text: `${listing.giverName} has been told the item is yours.`, done: true },
    { title: "Giver hands it to Gratis Castle", text: "They drop it at our hub, or our dispatch rider collects it.", done: false },
    { title: isPickup ? "Ready for collection" : "Out for delivery", text: isPickup ? `We'll tell you when it's waiting at ${hubName ?? "your hub"}. Bring a valid ID.` : "We deliver it to your address — free of charge.", done: false },
    { title: "Confirm you received it", text: "Tap “I've received it” in your orders to complete the handover.", done: false },
  ];

  return (
    <div className="container-page flex justify-center py-8 sm:py-14">
      <div className="w-full max-w-lg text-center">
        <span className="mx-auto flex size-20 animate-fade-up items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-11" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold sm:text-3xl">Order confirmed!</h1>
        <p className="mt-2 text-muted-foreground"><strong className="text-foreground">{listing.title}</strong> is yours. Order number <strong className="text-foreground">{order.order_number}</strong>.</p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-left text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-semibold">₦0</span></div>
          <div className="mt-1.5 flex justify-between"><span className="text-muted-foreground">{isPickup ? "Hub pickup" : "Delivery"}</span><span className="font-semibold">₦0</span></div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 font-extrabold"><span>Total paid</span><span>₦0</span></div>
        </div>

        <ol className="mt-6 space-y-3 text-left">
          {next.map((step, index) => (
            <li key={step.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", step.done ? "bg-success text-white" : "bg-primary-50 text-primary")}>
                {step.done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              <span><span className="block font-bold">{step.title}</span><span className="text-sm text-muted-foreground">{step.text}</span></span>
            </li>
          ))}
        </ol>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-success"><ShieldCheck className="size-4" /> {NO_HIDDEN_FEE} Never pay a rider or anyone else.</p>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          <Button asChild size="lg"><Link href={`/account/requests?order=${order.id}`}><Receipt className="size-4" /> Track my order</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/explore">Keep exploring</Link></Button>
        </div>
      </div>
    </div>
  );
}
