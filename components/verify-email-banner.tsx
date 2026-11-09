"use client";

import { MailWarning } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";

/** Reminds signed-in members to verify their email — required to give and request items. */
export function VerifyEmailBanner() {
  const { user } = useSession();
  const [busy, setBusy] = useState(false);

  if (!user || user.email_verified) return null;

  async function resend() {
    setBusy(true);
    try {
      const response = await api.post<{ message: string }>("auth/email/resend");
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof ApiError && error.status === 429 ? "Please wait a minute before asking again." : "Could not send the email. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-border bg-accent/40">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
        <MailWarning className="size-4 shrink-0 text-primary" />
        <span>Please verify <strong>{user.email}</strong> to give and request items.</span>
        <button type="button" onClick={resend} disabled={busy} className="font-semibold text-primary hover:underline disabled:opacity-60">
          {busy ? "Sending…" : "Resend verification email"}
        </button>
      </div>
    </div>
  );
}
