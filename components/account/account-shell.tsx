"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandHeart } from "lucide-react";
import { ACCOUNT_LINKS } from "@/components/site-chrome";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifyEmailPanel } from "@/components/verify-email-panel";
import { useSession } from "@/hooks/use-session";
import { profilePath } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Layout for every /account page: sign-in and email-verification gates plus sidebar (desktop) or tabs (mobile). */
export function AccountShell({ children }: { children: React.ReactNode }) {
  const { user, session, isLoading } = useSession();
  const pathname = usePathname();

  if (isLoading) {
    return <div className="container-page py-12"><div className="h-8 w-56 animate-pulse rounded bg-muted" /><div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" /></div>;
  }

  if (!user) {
    return (
      <div className="container-page py-20 text-center">
        <HandHeart className="mx-auto size-10 text-primary" />
        <h1 className="mt-4 text-3xl font-bold">Your community space</h1>
        <p className="mt-2 text-muted-foreground">Sign in to manage the things you give and find.</p>
        <Button asChild className="mt-6"><Link href={`/auth?next=${encodeURIComponent(pathname)}`}>Sign in</Link></Button>
      </div>
    );
  }

  if (!user.email_verified) {
    return (
      <div className="container-page flex justify-center py-10">
        <VerifyEmailPanel />
      </div>
    );
  }

  const badgeFor = (href: string) =>
    href === "/account/messages" ? session?.unreadConversations ?? 0 : href === "/account/notifications" ? session?.unreadNotifications ?? 0 : 0;

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Account navigation">
          <div className="sticky top-32 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <Avatar url={user.avatar_url} name={user.name} className="size-11" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <Link href={profilePath(user.slug)} className="text-xs text-primary hover:underline">View public profile</Link>
              </div>
            </div>
            <nav className="rounded-2xl border border-border bg-card p-2">
              {ACCOUNT_LINKS.map((link) => {
                const active = pathname === link.href || (link.href !== "/account" && pathname.startsWith(link.href));
                const count = badgeFor(link.href);
                return (
                  <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-cream text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                    <link.icon className="size-4" />
                    <span className="flex-1">{link.label}</span>
                    {count > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{count}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0">
          <nav aria-label="Account sections" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
            {ACCOUNT_LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/account" && pathname.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  <link.icon className="size-3.5" /> {link.label}
                </Link>
              );
            })}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
