"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-fields";
import { api } from "@/lib/api";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@/lib/auth-paths";
import { AuthInput, PasswordInput, authErrorMessage } from "./auth-fields";

/** Set a new password from the emailed link (copied from gapcastle-lovable/src/routes/reset-password.tsx). */
export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("auth/reset-password", { token, email, password, password_confirmation: password });
      toast.success("Password updated — you can now sign in");
      router.push(LOGIN_PATH);
    } catch (err) {
      setFailed(true);
      toast.error(authErrorMessage(err, "Could not update password"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="account-email">Email</Label>
        <AuthInput id="account-email" type="email" name="email" value={email} autoComplete="username" readOnly className="bg-muted/50 text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput id="new-password" name="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters with letters and numbers" autoComplete="new-password" enterKeyHint="done" minLength={8} required autoFocus />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Updating…" : "Update password"}
      </Button>
      {failed && (
        <p className="text-center text-sm text-muted-foreground">
          Link expired or already used? <Link href={FORGOT_PASSWORD_PATH} className="font-semibold text-primary hover:underline">Request a new one</Link>
        </p>
      )}
    </form>
  );
}
