"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SESSION_KEY } from "@/hooks/use-session";

/** Landing page for the email verification link, in the Lovable centred-message style. */
export function VerifiedStatus() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const success = params.get("status") === "success";

  useEffect(() => {
    if (success) void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  }, [success, queryClient]);

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16 text-center">
      <div>
        <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-highlight/25 text-3xl">{success ? "🎉" : "✉️"}</span>
        <h1 className="text-2xl font-bold">{success ? "Your email is verified" : "That link didn't work"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {success ? "You can now give and request items. Welcome to the community!" : "It may have expired. Sign in and resend the verification email."}
        </p>
        <Button asChild className="mt-6">
          <Link href={success ? "/explore" : "/auth"}>{success ? "Explore free items" : "Back to sign in"}</Link>
        </Button>
      </div>
    </div>
  );
}
