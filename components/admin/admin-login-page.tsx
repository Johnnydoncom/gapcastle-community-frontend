"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-fields";
import { SESSION_KEY, sessionFromAccount } from "@/hooks/use-session";
import { ApiError, authRequest } from "@/lib/api";
import type { Account } from "@/lib/types";
import logoMark from "@/public/brand/logo-mark.png";
import { BrandWordmark } from "@/components/brand-wordmark";

function safeNext(next?: string | null): string {
  return next && next.startsWith("/admin") ? next : "/admin";
}

/** Dedicated login page for admin and moderator users. */
export function AdminLoginPage() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await authRequest<{ user: Account }>("login", { email, password });

      if (!user.is_admin && !user.is_moderator) {
        toast.error("This account does not have admin or moderator access.");
        await authRequest("logout").catch(() => undefined);
        return;
      }

      queryClient.clear();
      queryClient.setQueryData(SESSION_KEY, sessionFromAccount(user));
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY });

      if (!user.email_verified) {
        toast.info("Please verify your email to continue.");
        router.push(`/verify-email?next=${encodeURIComponent(next)}`);
      } else {
        toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
        router.push(next);
      }
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.status === 429
          ? "Too many attempts. Please wait a minute and try again."
          : (Object.values(err.errors)[0]?.[0] ?? err.message))
        : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header / Branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src={logoMark} alt="" className="h-10 w-auto" priority sizes="48px" />
            <BrandWordmark />
          </Link>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <div className="mb-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold">Admin sign in</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to the Gratis Castle admin console.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gratiscastle.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs">
            <Link href="/reset-password" className="text-muted-foreground hover:text-primary hover:underline">
              Forgot your password?
            </Link>
          </p>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            ← Back to Gratis Castle
          </Link>
        </p>
      </div>
    </div>
  );
}
