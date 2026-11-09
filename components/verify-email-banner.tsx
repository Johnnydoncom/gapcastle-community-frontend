"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MailWarning } from "lucide-react";
import { useSession } from "@/hooks/use-session";

/** Reminds signed-in members to verify their email — required to give and request items. */
export function VerifyEmailBanner() {
  const { user } = useSession();
  const pathname = usePathname();

  if (!user || user.email_verified || pathname.startsWith("/verify-email")) return null;

  return (
    <div className="border-b border-border bg-accent/40">
      <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
        <MailWarning className="size-4 shrink-0 text-primary" />
        <span>Please verify <strong>{user.email}</strong> to give and request items.</span>
        <Link href={`/verify-email?next=${encodeURIComponent(pathname)}`} className="font-semibold text-primary hover:underline">
          Verify with a code
        </Link>
      </div>
    </div>
  );
}
