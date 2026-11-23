"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/form-fields";
import { SESSION_KEY, sessionFromAccount, useSession } from "@/hooks/use-session";
import { ApiError } from "@/lib/api";
import { safeNext, withNext } from "@/lib/auth-paths";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Taller inputs with 16px text on phones: easier to tap, and iOS Safari doesn't zoom the page
 * when a field is focused. Desktop keeps the standard compact size.
 */
export const AUTH_INPUT_CLASS = "h-12 rounded-xl text-base sm:h-11 sm:text-sm";

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn(AUTH_INPUT_CLASS, className)} {...props} />;
}

/** Password input with a show/hide toggle sized for thumbs. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <AuthInput
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-5 sm:size-4" /> : <Eye className="size-5 sm:size-4" />}
      </button>
    </div>
  );
}

/** Props shared by every email field on the auth screens. */
export const EMAIL_INPUT_PROPS = {
  type: "email",
  inputMode: "email",
  autoComplete: "email",
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
  placeholder: "you@example.com",
} as const;

/** The first validation message from the API, or a friendly fallback. */
export function authErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.status === 429) return "Too many attempts. Please wait a minute and try again.";
  return Object.values(err.errors)[0]?.[0] ?? err.message;
}

/** The `?next=` destination, read at submit time so the auth pages can stay statically rendered. */
export function currentNext(): string {
  if (typeof window === "undefined") return "/";
  return safeNext(new URLSearchParams(window.location.search).get("next"));
}

/** Seed the session cache after sign in / join so the header updates straight away. */
export function useStoreSession() {
  const queryClient = useQueryClient();
  return (user: Account) => {
    queryClient.clear();
    queryClient.setQueryData(SESSION_KEY, sessionFromAccount(user));
    void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  };
}

function NextAwareLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const next = useSearchParams().get("next");
  return <Link href={withNext(href, next)} className={className}>{children}</Link>;
}

/** A link to another auth screen that carries `?next=` along, without opting the page out of static rendering. */
export function KeepNextLink(props: { href: string; className?: string; children: ReactNode }) {
  return (
    <Suspense fallback={<Link href={props.href} className={props.className}>{props.children}</Link>}>
      <NextAwareLink {...props} />
    </Suspense>
  );
}

/** Members who open the sign-in or join screen while already signed in go straight on. Checked once, on load only. */
export function RedirectIfSignedIn() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (isLoading || checked.current) return;
    checked.current = true;
    if (!user) return;
    const next = currentNext();
    if (user.email_verified) {
      router.replace(next);
    } else {
      toast.info("Please verify your email to continue.");
      router.replace(`/verify-email?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, user, router]);

  return null;
}
