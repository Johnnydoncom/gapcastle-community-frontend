"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ExternalLink,
  FolderTree,
  HandHeart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Search,
  Settings,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSession, useSignOut } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import logoMark from "@/public/brand/logo-mark.png";
import { BrandWordmark } from "@/components/brand-wordmark";

type Counts = { pending_moderation: number; open_reports: number };

const NAV: Array<{ group: string; links: Array<{ href: string; label: string; icon: typeof Activity; badge?: keyof Counts }> }> = [
  { group: "Overview", links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    group: "Catalogue",
    links: [
      { href: "/admin/listings", label: "Listings", icon: Package, badge: "pending_moderation" },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    group: "Logistics",
    links: [
      { href: "/admin/requests", label: "Requests", icon: HandHeart },
      { href: "/admin/locations", label: "Pickup locations", icon: MapPin },
    ],
  },
  {
    group: "People",
    links: [
      { href: "/admin/users", label: "Members", icon: Users },
      { href: "/admin/admins", label: "Admins & moderators", icon: UserCog },
    ],
  },
  {
    group: "Trust & content",
    links: [
      { href: "/admin/reports", label: "Reports", icon: TriangleAlert, badge: "open_reports" },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    group: "System",
    links: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/activity", label: "Activity log", icon: Activity },
    ],
  },
];

/**
 * The admin dashboard's own application layout — a fixed sidebar and top bar,
 * separate from the public marketplace chrome. Only moderators and admins get in.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSession();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const { data: counts } = useQuery({
    queryKey: ["admin-counts"],
    queryFn: () => api.get<{ data: Counts }>("admin/overview").then((response) => response.data),
    enabled: !!user?.is_moderator,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary" /></div>;
  }

  if (!user || !user.is_moderator) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary"><ShieldCheck className="size-7" /></span>
          <h1 className="mt-4 text-xl font-extrabold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">This area is for Gap Castle administrators and community moderators.</p>
          <div className="mt-6 grid gap-2">
            {!user && <Button asChild><Link href="/auth?next=/admin">Sign in</Link></Button>}
            <Button asChild variant="outline"><Link href="/">Back to Gap Castle</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = <SidebarNav pathname={pathname} counts={counts} onNavigate={() => setNavOpen(false)} />;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink text-ink-foreground lg:flex">{sidebar}</aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="flex w-72 flex-col border-0 bg-ink p-0 text-ink-foreground">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open admin navigation">
            <Menu className="size-5" />
          </Button>
          <AdminSearch />
          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href="/" target="_blank"><ExternalLink className="size-4" /> View site</Link>
            </Button>
            <UserMenu name={user.name} email={user.email} avatar={user.avatar_url} role={user.is_admin ? "Administrator" : "Moderator"} />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({ pathname, counts, onNavigate }: { pathname: string; counts?: Counts; onNavigate: () => void }) {
  return (
    <>
      <Link href="/admin" onClick={onNavigate} aria-label="Gap Castle admin console" className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-5">
        <Image src={logoMark} alt="" className="h-8 w-auto shrink-0" sizes="48px" />
        <BrandWordmark inverted tagline="Admin console" />
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-foreground/45">{section.group}</p>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
                const badge = link.badge ? counts?.[link.badge] ?? 0 : 0;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-brand-yellow-400)]" : "text-ink-foreground/75 hover:bg-white/6 hover:text-white",
                      )}
                    >
                      <link.icon className="size-4 shrink-0" />
                      <span className="flex-1">{link.label}</span>
                      {badge > 0 && <span className="rounded-full bg-highlight px-1.5 text-[11px] font-extrabold leading-5 text-highlight-foreground">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-foreground/75 hover:bg-white/6 hover:text-white">
          <ExternalLink className="size-4" /> Back to the marketplace
        </Link>
      </div>
    </>
  );
}

function AdminSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (q.trim()) router.push(`/admin/listings?q=${encodeURIComponent(q.trim())}`);
  }
  return (
    <form onSubmit={submit} role="search" className="relative hidden w-full max-w-md md:block">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search listings…"
        aria-label="Search listings"
        className="h-10 w-full rounded-xl border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-ring/30"
      />
    </form>
  );
}

function UserMenu({ name, email, avatar, role }: { name: string; email: string; avatar: string | null; role: string }) {
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-muted" aria-label="Account menu">
          <Avatar url={avatar} name={name} className="size-8" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-32 truncate text-sm font-semibold">{name}</span>
            <span className="block text-[11px] text-muted-foreground">{role}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal"><span className="block font-semibold">{name}</span><span className="block truncate text-xs text-muted-foreground">{email}</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/account" className="cursor-pointer">My member account</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/" className="cursor-pointer">View marketplace</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer"><LogOut className="size-4" /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Kept for older admin screens; new screens use PageHeader from ./ui. */
export function AdminHeading({ title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}</div>
      {action}
    </div>
  );
}
