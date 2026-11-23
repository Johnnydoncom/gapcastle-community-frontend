"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-fields";
import { authRequest } from "@/lib/api";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth-paths";
import type { Account } from "@/lib/types";
import { AuthInput, EMAIL_INPUT_PROPS, PasswordInput, RedirectIfSignedIn, authErrorMessage, currentNext, useStoreSession } from "./auth-fields";

/** Sign-in form (the "signin" mode of gapcastle-lovable/src/routes/auth.tsx). */
export function LoginForm() {
  const router = useRouter();
  const storeSession = useStoreSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await authRequest<{ user: Account }>("login", { email: email.trim(), password });
      storeSession(user);
      const next = currentNext();
      const firstName = user.name.split(" ")[0];
      if (!user.email_verified) {
        toast.info(`Welcome back, ${firstName}! Please verify your email to continue.`);
        router.push(`/verify-email?next=${encodeURIComponent(next)}`);
      } else {
        toast.success(`Welcome back, ${firstName}!`);
        router.push(next);
      }
    } catch (err) {
      toast.error(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <RedirectIfSignedIn />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <AuthInput id="email" name="email" {...EMAIL_INPUT_PROPS} enterKeyHint="next" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link href={FORGOT_PASSWORD_PATH} className="-my-2 py-2 text-xs font-medium text-primary hover:underline">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" enterKeyHint="go" minLength={8} required />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
