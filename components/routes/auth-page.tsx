"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-fields";
import { SESSION_KEY, sessionFromAccount } from "@/hooks/use-session";
import { ApiError, authRequest } from "@/lib/api";
import type { Account } from "@/lib/types";
import logoMark from "@/public/brand/logo-mark.png";

function safeNext(next?: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// Based on gapcastle-lovable/src/routes/auth.tsx (sign in and join in one card).
export function AuthPage() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "join" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = mode === "signup"
        ? await authRequest<{ user: Account }>("register", { name: fullName || email.split("@")[0], email, password, location: location || null })
        : await authRequest<{ user: Account }>("login", { email, password });
      queryClient.clear();
      queryClient.setQueryData(SESSION_KEY, sessionFromAccount(user));
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      if (mode === "signup") {
        toast.success("Welcome to the community! We've emailed you a 6-digit code to verify your account.");
        router.push(`/verify-email?sent=1&next=${encodeURIComponent(next)}`);
      } else if (!user.email_verified) {
        toast.info(`Welcome back, ${user.name.split(" ")[0]}! Please verify your email to continue.`);
        router.push(`/verify-email?next=${encodeURIComponent(next)}`);
      } else {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
        router.push(next);
      }
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.status === 429 ? "Too many attempts. Please wait a minute and try again." : (Object.values(err.errors)[0]?.[0] ?? err.message))
        : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-6 text-center">
          <Image src={logoMark} alt="Gratis Castle" className="mx-auto mb-3 h-12 w-auto" priority />
          <h1 className="text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Join the community"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to request items and manage your listings." : "Create a free account to give and receive."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8}
                placeholder={mode === "signup" ? "8+ characters with letters and numbers" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} required className="pr-10" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="location">General area <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Yaba, Lagos" />
              </div>
              <p className="text-xs text-muted-foreground">
                By joining you agree to our <Link href="/community-guidelines" className="text-primary hover:underline">community guidelines</Link>, <Link href="/terms" className="text-primary hover:underline">terms</Link> and <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link> — including that items are never sold.
              </p>
            </>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to Gratis Castle? " : "Already a member? "}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Join the community" : "Sign in"}
          </button>
        </p>
        {mode === "signin" && (
          <p className="mt-2 text-center text-xs">
            <Link href="/reset-password" className="text-muted-foreground hover:text-primary hover:underline">Forgot your password?</Link>
          </p>
        )}
      </div>
    </div>
  );
}
