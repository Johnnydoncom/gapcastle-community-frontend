"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-fields";
import { toast } from "sonner";

function message(err: unknown, fallback: string) {
  return err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : fallback;
}

// Copied from gapcastle-lovable/src/routes/reset-password.tsx.
// Lovable's version showed "Password reset link required" when opened without a link. Here that
// state shows a form in the same card style to email a reset link, because Laravel sends the link.
export function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const isRecovery = !!token && !!email;
  const [password, setPassword] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("auth/reset-password", { token, email, password, password_confirmation: password });
      toast.success("Password updated — you can now sign in");
      router.push("/auth");
    } catch (err) {
      toast.error(message(err, "Could not update password"));
    } finally {
      setBusy(false);
    }
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("auth/forgot-password", { email: requestEmail });
      setSent(true);
    } catch (err) {
      toast.error(message(err, "Could not send the reset link"));
    } finally {
      setBusy(false);
    }
  }

  if (!isRecovery) {
    if (sent) {
      return (
        <div className="container-page flex min-h-[60vh] items-center justify-center py-16 text-center">
          <div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for that email, open the password reset link we sent to set a new password.
            </p>
            <Button asChild className="mt-6">
              <a href="/auth">Back to sign in</a>
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
        <form onSubmit={requestLink} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-soft">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" type="email" value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
