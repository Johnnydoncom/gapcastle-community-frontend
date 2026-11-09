"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { VerifyEmailPanel } from "@/components/verify-email-panel";
import { useSession } from "@/hooks/use-session";

function safeNext(next?: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Required step after joining (and after signing in unverified): confirm the email with a one-time code. */
export function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNext(params.get("next"));
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace(`/auth?next=${encodeURIComponent(`/verify-email?next=${encodeURIComponent(next)}`)}`);
    else if (user.email_verified) router.replace(next);
  }, [isLoading, user, next, router]);

  return (
    <div className="container-page flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      {isLoading || !user || user.email_verified ? (
        <div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-muted" />
      ) : (
        <VerifyEmailPanel initiallySent={params.get("sent") === "1"} onVerified={() => router.replace(next)} />
      )}
    </div>
  );
}
