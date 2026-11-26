"use client";

import Link from "next/link";
import { Gift, Receipt, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/hooks/use-session";

/**
 * The marketplace "Hi there" card beside the hero banner. Personal, so it renders
 * on the client; signed-out visitors (and crawlers) see the welcome version.
 */
export function HeroAccountCard() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return <div className="h-[168px] animate-pulse rounded-3xl border border-border bg-card" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary"><UserRound className="size-5" /></span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">Welcome to Gratis Castle</p>
            <p className="text-xs text-muted-foreground">Free items, free hub pickup.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700">Sign in</Link>
          <Link href="/register" className="inline-flex h-10 items-center justify-center rounded-xl border border-border text-sm font-semibold transition-colors hover:border-primary-200 hover:bg-primary-50">Join free</Link>
        </div>
      </div>
    );
  }

  const firstName = user.first_name ?? user.name.split(" ")[0];
  const left = Math.max(0, (user.claims?.monthly_limit ?? 3) - (user.claims?.this_month ?? 0));

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar url={user.avatar_url} name={user.name} className="size-11" />
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">Hi, {firstName}</p>
          <p className="text-xs text-muted-foreground">{left} of {user.claims?.monthly_limit ?? 3} free items left this month</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/account/requests" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700"><Receipt className="size-4" /> My orders</Link>
        <Link href="/give" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold transition-colors hover:border-primary-200 hover:bg-primary-50"><Gift className="size-4" /> Give</Link>
      </div>
    </div>
  );
}
