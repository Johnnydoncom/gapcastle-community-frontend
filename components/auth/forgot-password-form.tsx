"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-fields";
import { api } from "@/lib/api";
import { LOGIN_PATH } from "@/lib/auth-paths";
import { AuthInput, EMAIL_INPUT_PROPS, authErrorMessage } from "./auth-fields";

/** Ask Laravel to email a password reset link (it lands on /reset-password?token=…&email=…). */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("auth/forgot-password", { email: email.trim() });
      setSentTo(email.trim());
    } catch (err) {
      toast.error(authErrorMessage(err, "Could not send the reset link"));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="text-center" role="status">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <MailCheck className="size-6" />
        </span>
        <h2 className="mt-3 text-lg font-semibold">Check your email</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          If an account exists for <strong className="break-all text-foreground">{sentTo}</strong>, we&apos;ve sent a link to set a new password. It expires in 60 minutes.
        </p>
        <div className="mt-6 grid gap-2">
          <Button asChild size="lg"><Link href={LOGIN_PATH}>Back to sign in</Link></Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => setSentTo(null)}>Use a different email</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reset-email">Email</Label>
        <AuthInput id="reset-email" name="email" {...EMAIL_INPUT_PROPS} enterKeyHint="send" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
