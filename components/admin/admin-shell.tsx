"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ExternalLink,
  FolderTree,
  Globe,
  HandHeart,
  Inbox,
  LayoutDashboard,
  Map,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  Package,
  Search,
  Settings,
  Star,
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
import logoMarkWhite from "@/public/brand/logo-mark-white.png";
import { BrandWordmark } from "@/components/brand-wordmark";

type Counts = { pending_moderation: number; open_reports: number; new_contact_messages: number; open_orders: number };

const NAV: Array<{ group: string; links: Array<{ href: string; label: string; icon: typeof Activity; badge?: keyof Counts; also?: string[] }> }> = [
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
      { href: "/admin/requests", label: "Orders", icon: HandHeart, badge: "open_orders" },
      { href: "/admin/locations", label: "Pickup hubs", icon: MapPin },
      { href: "/admin/states", label: "States & LGAs", icon: Map, also: ["/admin/lgas"] },
    ],
  },
  {
    group: "People",
    links: [
      { href: "/admin/users", label: "Members", icon: Users },
      { href: "/admin/admins", label: "Admins & moderators", icon: UserCog },
      { href: "/admin/inbox", label: "Contact inbox", icon: Inbox, badge: "new_contact_messages" },
    ],
  },
  {
    group: "Trust & content",
    links: [
      { href: "/admin/reports", label: "Reports", icon: TriangleAlert, badge: "open_reports" },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/seo", label: "Pages & SEO", icon: Globe },
    ],
  },
  {
    group: "System",
    links: [
      { href: "/admin/settings", label: "Site settings", icon: Settings },
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

  // The admin login page lives under /admin/login but should render without the shell chrome.
  const isLoginRoute = pathname === "/admin/login";

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary" /></div>;
  }

  if (!user || !user.is_moderator) {
    return <AdminLoginRedirect pathname={pathname} />;
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
      <Link href="/admin" onClick={onNavigate} aria-label="Gratis Castle admin console" className="flex h-14 sm:h-16 shrink-0 text-left items-center gap-2.5 border-b border-white/10 px-5">
        <Image src={logoMarkWhite} alt="" className="h-6 w-auto shrink-0" sizes="48px" />
        <BrandWordmark inverted tagline="admin console" className="text-[16px] sm:text-[20px]" />
      </Link>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.group} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-foreground/45">{section.group}</p>
            <ul className="space-y-0.5">
              {section.links.map((link) => {
                const active = link.href === "/admin" ? pathname === "/admin" : [link.href, ...(link.also ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
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
  const [scope, setScope] = useState("listings");
  function submit(event: FormEvent) {
    event.preventDefault();
    const target = scope === "members" ? "/admin/users" : scope === "orders" ? "/admin/requests" : "/admin/listings";
    if (q.trim()) router.push(`${target}?q=${encodeURIComponent(q.trim())}`);
  }
  return (
    <form onSubmit={submit} role="search" className="hidden w-full max-w-lg items-center rounded-xl border border-input bg-muted/50 transition focus-within:border-primary/50 focus-within:bg-card focus-within:ring-2 focus-within:ring-ring/30 md:flex">
      <select value={scope} onChange={(event) => setScope(event.target.value)} aria-label="Search in" className="select-caret h-10 shrink-0 rounded-l-xl border-r border-input bg-transparent pl-3 text-sm font-medium outline-none">
        <option value="listings">Listings</option>
        <option value="members">Members</option>
        <option value="orders">Orders</option>
      </select>
      <span className="relative flex flex-1 items-center">
        <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={scope === "members" ? "Name or email…" : scope === "orders" ? "Order number, item or member…" : "Title, area or giver…"}
          aria-label={`Search ${scope}`}
          className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none"
        />
      </span>
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

/** Redirect to the admin login page from an effect so we don't setState during render. */
function AdminLoginRedirect({ pathname }: { pathname: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);
  return <div className="flex min-h-screen items-center justify-center bg-background"><div className="size-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary" /></div>;
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
