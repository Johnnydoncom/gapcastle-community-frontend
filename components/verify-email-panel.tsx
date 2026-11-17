"use client";

import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SESSION_KEY, useSession, useSignOut } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";
import type { Account, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import logoMark from "@/public/brand/logo-mark.png";

const CODE_LENGTH = 6;
const DEFAULT_COOLDOWN = 60;

type ResendResponse = { message: string; resend_available_in?: number };

/**
 * Six boxes backed by one real input, so paste, SMS/email autofill
 * (autocomplete="one-time-code") and screen readers all work naturally.
 */
function CodeInput({ value, onChange, disabled, invalid }: { value: string; onChange: (code: string) => void; disabled?: boolean; invalid?: boolean }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xs" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        id="verification-code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={CODE_LENGTH}
        disabled={disabled}
        aria-label="6-digit verification code"
        aria-invalid={invalid || undefined}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0 disabled:cursor-not-allowed"
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden="true">
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const char = value[index];
          const active = focused && !disabled && (index === value.length || (index === CODE_LENGTH - 1 && value.length === CODE_LENGTH));
          return (
            <div
              key={index}
              className={cn(
                "flex h-14 items-center justify-center rounded-xl border bg-background text-2xl font-bold tabular-nums transition-colors",
                invalid ? "border-destructive" : active ? "border-primary ring-2 ring-primary/20" : char ? "border-primary/40" : "border-input",
                disabled && "opacity-60",
              )}
            >
              {char ?? (active ? <span className="h-6 w-px animate-pulse bg-primary" /> : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Email verification by one-time code. New members arrive with a code already sent;
 * members signing in unverified are prompted to send themselves a fresh one.
 */
export function VerifyEmailPanel({ initiallySent = false, onVerified }: { initiallySent?: boolean; onVerified?: (user: Account) => void }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const [sent, setSent] = useState(initiallySent);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(initiallySent ? DEFAULT_COOLDOWN : 0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    setSending(true);
    setError(null);
    try {
      const response = await api.post<ResendResponse>("auth/email/resend");
      toast.success(response.message);
      setSent(true);
      setCode("");
      setCooldown(response.resend_available_in ?? DEFAULT_COOLDOWN);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setSent(true);
        const match = /(\d+) seconds/.exec(err.message);
        setCooldown(match ? Number(match[1]) : DEFAULT_COOLDOWN);
        toast.error(err.message.includes("seconds") ? err.message : "Please wait a minute before asking for another code.");
      } else {
        toast.error("We couldn't send the code. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function verify(value = code) {
    if (value.length !== CODE_LENGTH || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const response = await api.post<{ message: string; user: Account }>("auth/email/verify", { code: value });
      queryClient.setQueryData<Session | null>(SESSION_KEY, (current) => (current ? { ...current, user: response.user } : current));
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      toast.success(response.message);
      onVerified?.(response.user);
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.status === 429 ? "Too many attempts. Please wait a minute and try again." : (err.field("code") ?? err.message))
        : "Something went wrong. Please try again.";
      setError(message);
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  function handleChange(next: string) {
    setCode(next);
    if (error) setError(null);
    if (next.length === CODE_LENGTH) void verify(next);
  }

  const email = user?.email;

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
      <div className="mb-6 text-center">
        <Image src={logoMark} alt="Gratis Castle" className="mx-auto mb-3 h-12 w-auto" priority />
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sent
            ? <>Enter the 6-digit code we sent to <strong className="font-semibold text-foreground">{email}</strong>.</>
            : <>Your email <strong className="font-semibold text-foreground">{email}</strong> isn&apos;t verified yet. We&apos;ll send you a 6-digit code to confirm it&apos;s you.</>}
        </p>
      </div>

      {sent ? (
        <form onSubmit={(e) => { e.preventDefault(); void verify(); }} className="space-y-4">
          <CodeInput value={code} onChange={handleChange} disabled={verifying} invalid={!!error} />
          <p role="alert" aria-live="polite" className={cn("min-h-5 text-center text-sm", error ? "text-destructive" : "text-muted-foreground")}>
            {error ?? "The code expires in 15 minutes."}
          </p>
          <Button type="submit" className="w-full" size="lg" disabled={verifying || code.length !== CODE_LENGTH}>
            {verifying ? "Verifying…" : "Verify email"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t get it? Check your spam folder or{" "}
            {cooldown > 0 ? (
              <span className="font-medium tabular-nums">resend in 0:{String(cooldown).padStart(2, "0")}</span>
            ) : (
              <button type="button" onClick={sendCode} disabled={sending} className="font-semibold text-primary hover:underline disabled:opacity-60">
                {sending ? "sending…" : "resend code"}
              </button>
            )}
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-accent/40 px-4 py-3 text-sm">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Verifying your email keeps the community safe. It&apos;s required before you can give or request items.</span>
          </div>
          <Button type="button" className="w-full" size="lg" onClick={sendCode} disabled={sending}>
            {sending ? "Sending code…" : "Send verification code"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have a code?{" "}
            <button type="button" onClick={() => setSent(true)} className="font-semibold text-primary hover:underline">Enter it</button>
          </p>
        </div>
      )}

      <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Wrong email address?{" "}
        <button type="button" onClick={() => void signOut()} className="font-semibold text-primary hover:underline">Sign out</button>
        {" "}and join again with the right one.
      </p>
    </div>
  );
}
