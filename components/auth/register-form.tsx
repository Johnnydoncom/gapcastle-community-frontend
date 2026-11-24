"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-fields";
import { Checkbox } from "@/components/ui/toggles";
import { authRequest } from "@/lib/api";
import type { Account } from "@/lib/types";
import { AuthInput, EMAIL_INPUT_PROPS, PasswordInput, RedirectIfSignedIn, authErrorMessage, currentNext, useStoreSession } from "./auth-fields";

/** Join form (the "signup" mode of gapcastle-lovable/src/routes/auth.tsx). */
export function RegisterForm() {
  const router = useRouter();
  const storeSession = useStoreSession();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!adult) {
      toast.error("You must be 18 or older to join Gratis Castle.");
      return;
    }
    setBusy(true);
    try {
      const { user } = await authRequest<{ user: Account }>("register", {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        email: email.trim(),
        phone,
        password,
        location: location.trim() || null,
        adult_confirmed: adult,
      });
      storeSession(user);
      toast.success("Welcome to the community! We've emailed you a 6-digit code to verify your account.");
      router.push(`/verify-email?sent=1&next=${encodeURIComponent(currentNext())}`);
    } catch (err) {
      toast.error(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <RedirectIfSignedIn />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="first-name">First name</Label>
          <AuthInput id="first-name" name="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" minLength={2} maxLength={60} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="middle-name">Middle name <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <AuthInput id="middle-name" name="additional-name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Chiamaka" autoComplete="additional-name" autoCapitalize="words" enterKeyHint="next" maxLength={60} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last-name">Surname</Label>
          <AuthInput id="last-name" name="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okafor" autoComplete="family-name" autoCapitalize="words" enterKeyHint="next" minLength={2} maxLength={60} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <AuthInput id="email" name="email" {...EMAIL_INPUT_PROPS} enterKeyHint="next" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <AuthInput id="phone" name="tel" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 123 4567" autoComplete="tel" enterKeyHint="next" required aria-describedby="phone-hint" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" name="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters with letters and numbers" autoComplete="new-password" enterKeyHint="next" minLength={8} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">General area <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <AuthInput id="location" name="address-level2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Yaba, Lagos" autoComplete="address-level2" autoCapitalize="words" enterKeyHint="done" maxLength={120} />
      </div>
      <label className="flex cursor-pointer items-start gap-3 p-y-2 text-sm">
        <Checkbox checked={adult} onCheckedChange={(v) => setAdult(v === true)} className="mmt-0.5" aria-required="true" />
        <span><strong>I confirm I am 18 years or older.</strong> <span className="text-muted-foreground">Gratis Castle is for adults only, and each person may have only one account.</span></span>
      </label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        By joining you agree to our <Link href="/community-guidelines" className="text-primary hover:underline">community guidelines</Link>, <Link href="/terms" className="text-primary hover:underline">terms</Link> and <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link> — including that items are never sold.
      </p>
      <Button type="submit" className="w-full" size="lg" disabled={busy || !adult}>
        {busy ? "Creating your account…" : "Create account"}
      </Button>
    </form>
  );
}
