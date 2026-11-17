"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import {
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Gift,
  HandHeart,
  Heart,
  House,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  PackageSearch,
  Search,
  Settings,
  ShieldCheck,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import { InstallAppButton } from "@/components/pwa/install-app-button";
import { ActiveHeaderSearch, HeaderSearch } from "@/components/site/header-search";
import { CurrentYear } from "@/components/site/current-year";
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
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import { useSession, useSignOut } from "@/hooks/use-session";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import logoMark from "@/public/brand/logo-mark.png";
import { BrandWordmark } from "@/components/brand-wordmark";

/**
 * Marketplace site chrome. Desktop: slim brand bar, sticky header with search and
 * account actions, and a server-rendered category strip. Phones get a native-app
 * shell: compact top bar (menu on tab roots, back button on inner screens), a
 * bottom tab bar, and screens with their own sticky action bar.
 * Anything that depends on the URL lives inside <Suspense> so pages still prerender.
 */

const PRIMARY_LINKS = [
  { href: "/explore", label: "Explore free items", icon: PackageSearch },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/pickup-hubs", label: "Pickup hubs", icon: MapPin },
  { href: "/how-it-works", label: "How it works", icon: HandHeart },
  { href: "/community", label: "Community", icon: Users },
  { href: "/faq", label: "Help & FAQs", icon: LifeBuoy },
];

export const ACCOUNT_LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/listings", label: "My listings", icon: Package },
  { href: "/account/requests", label: "My requests", icon: HandHeart },
  { href: "/account/saved", label: "Saved items", icon: Bookmark },
  { href: "/account/messages", label: "Messages", icon: MessageCircle },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Profile settings", icon: Settings },
];

/** Bottom-tab destinations: these show the menu button instead of a back button on phones. */
const TAB_ROOTS = ["/", "/explore", "/categories", "/give", "/account", "/account/messages", "/account/saved", "/auth"];

/** Screens where phones get their own sticky action bar instead of the bottom tabs. */
function hasOwnActionBar(pathname: string) {
  return /^\/items\/[^/]+(\/request)?$/.test(pathname);
}

/** Discovery screens show the search bar on phones; elsewhere a search icon is enough. */
function showsMobileSearch(pathname: string) {
  return pathname === "/" || pathname === "/explore" || pathname.startsWith("/categories");
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function Logo({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-2.5" aria-label="Gratis Castle home">
      <Image src={logoMark} alt="" priority className="h-8 w-auto shrink-0" sizes="48px" />
      <BrandWordmark inverted={inverted} className={cn(compact && "max-[359px]:hidden")} />
    </Link>
  );
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-[18px] text-destructive-foreground ring-2 ring-card">
      {count > 9 ? "9+" : count}
    </span>
  );
}

function HeaderIconLink({ href, label, count = 0, children, className }: { href: string; label: string; count?: number; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${label}${count ? `, ${count} unread` : ""}`}
      className={cn("relative flex size-10 items-center justify-center rounded-xl text-foreground transition-[background-color,transform] hover:bg-muted active:scale-90", className)}
    >
      {children}
      <CountBadge count={count} />
    </Link>
  );
}

export function SiteChrome({ children, categoryNav }: { children: ReactNode; categoryNav?: ReactNode }) {
  const { user, session } = useSession();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = () => setMenuOpen(true);

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />

      <header className="sticky top-0 z-40 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="container-page flex h-14 items-center gap-1.5 sm:h-16 sm:gap-4">
          <Suspense fallback={<MobileLeading pathname="/" onMenu={openMenu} />}>
            <ActiveMobileLeading onMenu={openMenu} />
          </Suspense>
          <Logo compact />

          <div className="hidden flex-1 md:block md:max-w-2xl md:px-2 lg:px-4">
            <Suspense fallback={<HeaderSearch />}>
              <ActiveHeaderSearch />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <HeaderIconLink href="/explore" label="Search free items" className="md:hidden"><Search className="size-5" /></HeaderIconLink>
            {user ? (
              <>
                {user.is_moderator && (
                  <Button asChild variant="ghost" size="sm" className="hidden xl:inline-flex">
                    <Link href="/admin"><ShieldCheck className="size-4" /> Admin</Link>
                  </Button>
                )}
                <HeaderIconLink href="/account/saved" label="Saved items" className="hidden sm:flex"><Heart className="size-5" /></HeaderIconLink>
                <HeaderIconLink href="/account/messages" label="Messages" count={session?.unreadConversations ?? 0} className="hidden sm:flex"><MessageCircle className="size-5" /></HeaderIconLink>
                <HeaderIconLink href="/account/notifications" label="Notifications" count={session?.unreadNotifications ?? 0}><Bell className="size-5" /></HeaderIconLink>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="ml-1 hidden items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex" aria-label="Account menu">
                      <Avatar url={user.avatar_url} name={user.name} className="size-8" />
                      <span className="hidden text-left leading-tight xl:block">
                        <span className="block text-[11px] text-muted-foreground">Hello,</span>
                        <span className="block max-w-24 truncate text-sm font-semibold">{user.name.split(" ")[0]}</span>
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                      <span className="block font-semibold">{user.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ACCOUNT_LINKS.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href} className="cursor-pointer"><link.icon className="size-4 text-muted-foreground" /> {link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    {user.is_moderator && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer"><ShieldCheck className="size-4 text-muted-foreground" /> Admin dashboard</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer">
                      <LogOut className="size-4 text-muted-foreground" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/auth" className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted">
                <UserRound className="size-5" />
                <span className="text-left text-sm font-semibold leading-tight sm:hidden">Sign in</span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-[11px] text-muted-foreground">Hello, sign in</span>
                  <span className="block text-sm font-semibold">Account</span>
                </span>
              </Link>
            )}
            <Button asChild variant="highlight" className="ml-1 hidden h-10 rounded-xl px-4 sm:inline-flex">
              <Link href="/give"><Gift className="size-4" /> Give an item</Link>
            </Button>
          </div>
        </div>

        <Suspense fallback={null}>
          <MobileSearchRow />
        </Suspense>

        {categoryNav && <div className="hidden border-t border-border md:block">{categoryNav}</div>}
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="flex w-[86%] max-w-sm flex-col gap-0 overflow-y-auto p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="bg-ink p-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-ink-foreground">
            <Logo inverted />
            {user ? (
              <div className="mt-5 flex items-center gap-3">
                <Avatar url={user.avatar_url} name={user.name} />
                <div className="min-w-0"><p className="truncate font-semibold text-white">{user.name}</p><p className="truncate text-xs text-ink-foreground/70">{user.email}</p></div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button asChild variant="highlight" onClick={() => setMenuOpen(false)}><Link href="/auth?mode=join">Join free</Link></Button>
                <Button asChild variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setMenuOpen(false)}><Link href="/auth">Sign in</Link></Button>
              </div>
            )}
          </div>
          <Suspense fallback={<MobileMenuLinks pathname="" isMember={!!user} isModerator={!!user?.is_moderator} onNavigate={() => setMenuOpen(false)} />}>
            <ActiveMobileMenuLinks isMember={!!user} isModerator={!!user?.is_moderator} onNavigate={() => setMenuOpen(false)} />
          </Suspense>
          <div className="mt-auto grid gap-2 border-t border-border p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <Button asChild variant="highlight" size="lg" onClick={() => setMenuOpen(false)}><Link href="/give"><Gift className="size-4" /> Give an item</Link></Button>
            <InstallAppButton variant="outline" size="lg" />
            {user && (
              <Button variant="ghost" size="lg" onClick={() => { setMenuOpen(false); void signOut(); }}><LogOut className="size-4" /> Sign out</Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Suspense fallback={null}>
        <VerifyEmailBanner />
      </Suspense>
      <main id="main" className="flex-1">{children}</main>

      <Suspense fallback={<SiteFooter />}>
        <FooterOutsideAdmin />
      </Suspense>

      <Suspense fallback={null}>
        <ActiveBottomNav session={session} />
      </Suspense>
    </div>
  );
}

/** Phones: the menu button on tab roots, an app-style back button on inner screens. */
function MobileLeading({ pathname, onMenu }: { pathname: string; onMenu: () => void }) {
  const router = useRouter();
  const isRoot = TAB_ROOTS.includes(pathname);

  if (!isRoot) {
    return (
      <button
        type="button"
        aria-label="Go back"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-xl transition-[background-color,transform] hover:bg-muted active:scale-90 lg:hidden"
      >
        <ChevronLeft className="size-6" />
      </button>
    );
  }

  return (
    <button type="button" aria-label="Open menu" onClick={onMenu} className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-xl transition-[background-color,transform] hover:bg-muted active:scale-90 lg:hidden">
      <Menu className="size-5" />
    </button>
  );
}

function ActiveMobileLeading({ onMenu }: { onMenu: () => void }) {
  return <MobileLeading pathname={usePathname()} onMenu={onMenu} />;
}

function TopBar() {
  return (
    <div className="hidden bg-ink text-ink-foreground sm:block">
      <div className="container-page flex h-9 items-center justify-between gap-4 text-xs">
        <p className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded bg-highlight px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-highlight-foreground">100% FREE</span>
          <span className="truncate">Every item is free — collect at a pickup hub or get it by waybill anywhere in Nigeria.</span>
        </p>
        <nav aria-label="Help" className="hidden shrink-0 items-center gap-5 md:flex">
          <Link href="/pickup-hubs" className="inline-flex items-center gap-1.5 hover:text-white"><MapPin className="size-3.5" /> Pickup hubs</Link>
          <Link href="/how-it-works" className="hover:text-white">How it works</Link>
          <Link href="/safety" className="hover:text-white">Safety</Link>
          <Link href="/faq" className="hover:text-white">Help</Link>
        </nav>
      </div>
    </div>
  );
}

function MobileSearchRow() {
  const pathname = usePathname();
  if (!showsMobileSearch(pathname)) return null;
  return (
    <div className="container-page pb-2.5 md:hidden">
      <Suspense fallback={<HeaderSearch compact />}>
        <ActiveHeaderSearch compact />
      </Suspense>
    </div>
  );
}

function MobileMenuLinks({ pathname, isMember, isModerator, onNavigate }: { pathname: string; isMember: boolean; isModerator: boolean; onNavigate: () => void }) {
  const itemClass = "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-muted active:bg-muted";
  return (
    <nav aria-label="Mobile navigation" className="flex flex-col p-3" onClick={onNavigate}>
      {PRIMARY_LINKS.map((link) => (
        <Link key={link.href} href={link.href} className={cn(itemClass, isActive(pathname, link.href) && "bg-secondary text-secondary-foreground")}>
          <link.icon className="size-4 text-primary" /> <span className="flex-1">{link.label}</span> <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      ))}
      {isMember && (
        <>
          <p className="mt-4 px-3 pb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">My account</p>
          {ACCOUNT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={cn(itemClass, pathname === link.href && "bg-secondary text-secondary-foreground")}>
              <link.icon className="size-4 text-primary" /> {link.label}
            </Link>
          ))}
          {isModerator && (
            <Link href="/admin" className={itemClass}>
              <ShieldCheck className="size-4 text-primary" /> Admin dashboard
            </Link>
          )}
        </>
      )}
    </nav>
  );
}

function ActiveMobileMenuLinks(props: { isMember: boolean; isModerator: boolean; onNavigate: () => void }) {
  return <MobileMenuLinks pathname={usePathname()} {...props} />;
}

function FooterOutsideAdmin() {
  const pathname = usePathname();
  return pathname.startsWith("/admin") ? null : <SiteFooter compactOnMobile={hasOwnActionBar(pathname)} />;
}

function SiteFooter({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
  return (
    <footer className={cn("mt-16 bg-ink text-ink-foreground", compactOnMobile ? "hidden md:block" : "pb-20 md:pb-0")}>
      <div className="border-b border-white/10">
        <div className="container-page grid gap-4 py-6 text-sm sm:grid-cols-3">
          {[
            { icon: Gift, title: "Always free", text: "No prices, no payments for items." },
            { icon: MapPin, title: "Pickup hubs", text: "Collect from a Gratis Castle hub in your state." },
            { icon: Truck, title: "Waybill nationwide", text: "Get items sent anywhere in Nigeria." },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-yellow-300"><item.icon className="size-5" /></span>
              <span><span className="block font-semibold text-white">{item.title}</span><span className="text-ink-foreground/70">{item.text}</span></span>
            </div>
          ))}
        </div>
      </div>
      <div className="container-page grid grid-cols-2 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 lg:col-span-1">
          <Logo inverted />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-foreground/75">
            A free community marketplace where good things find a second home. Every item is free — always.
          </p>
          <p className="mt-3 text-sm font-semibold text-brand-yellow-300">Give freely. Receive gratefully. Build community.</p>
          <div className="mt-5 inline-flex">
            <InstallAppButton variant="highlight" />
          </div>
          <SocialLinks />
        </div>
        <FooterColumn title="Community" links={[
          { href: "/explore", label: "Browse free items" },
          { href: "/categories", label: "Browse categories" },
          { href: "/give", label: "Give an item" },
          { href: "/pickup-hubs", label: "Pickup hubs" },
          { href: "/community", label: "Our community" },
        ]} />
        <FooterColumn title="Help" links={[
          { href: "/how-it-works", label: "How it works" },
          { href: "/faq", label: "FAQs" },
          { href: "/safety", label: "Safety guidelines" },
          { href: "/contact", label: "Contact us" },
        ]} />
        <FooterColumn title="Gratis Castle" links={[
          { href: "/about", label: "About Gratis Castle" },
          { href: "/community-guidelines", label: "Community guidelines" },
          { href: "/privacy", label: "Privacy policy" },
          { href: "/terms", label: "Terms of service" },
        ]} />
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-ink-foreground/60">
          © <CurrentYear /> Gratis Castle · Serving Nigeria only · Waybill or delivery costs, if any, are separate and agreed openly.
        </p>
      </div>
    </footer>
  );
}

function BottomNav({ pathname, session }: { pathname: string; session: Session | null }) {
  const user = session?.user;
  const items = [
    { href: "/", label: "Home", icon: House, match: pathname === "/" },
    { href: "/explore", label: "Explore", icon: PackageSearch, match: isActive(pathname, "/explore") || isActive(pathname, "/categories") },
    { href: "/give", label: "Give", icon: Gift, match: isActive(pathname, "/give"), primary: true },
    user
      ? { href: "/account/messages", label: "Chats", icon: MessageCircle, match: isActive(pathname, "/account/messages"), badge: session?.unreadConversations ?? 0 }
      : { href: "/account/saved", label: "Saved", icon: Heart, match: isActive(pathname, "/account/saved") },
    { href: user ? "/account" : "/auth", label: user ? "Account" : "Sign in", icon: UserRound, match: pathname === "/account" || pathname === "/auth" || (isActive(pathname, "/account") && !isActive(pathname, "/account/messages")) },
  ];

  return (
    <nav aria-label="Quick navigation" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-float backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.label}>
            <Link href={item.href} aria-current={item.match ? "page" : undefined} className={cn("relative flex flex-col items-center gap-0.5 pb-1.5 pt-2 text-[11px] font-semibold text-muted-foreground transition-colors active:opacity-70", item.match && "text-primary")}>
              <span
                className={cn(
                  "relative flex h-7 w-14 items-center justify-center rounded-full transition-all duration-200",
                  item.match && !("primary" in item) && "bg-secondary",
                  "primary" in item && item.primary && "-mt-6 size-13 w-13 rounded-2xl bg-highlight text-highlight-foreground shadow-lift ring-4 ring-card",
                )}
              >
                <item.icon className={cn("size-5", item.match && "stroke-[2.4]")} />
                {"badge" in item && !!item.badge && <span className="absolute right-3 top-0 size-2.5 rounded-full bg-destructive ring-2 ring-card" />}
              </span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ActiveBottomNav({ session }: { session: Session | null }) {
  const pathname = usePathname();
  if (hasOwnActionBar(pathname) || pathname.startsWith("/admin")) return null;
  return <BottomNav pathname={pathname} session={session} />;
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-sm font-bold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-ink-foreground/75">
        {links.map((link) => (
          <li key={link.href}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

/** Social profiles are configured per deployment (NEXT_PUBLIC_SOCIAL_*) so we never link to accounts that don't exist. */
function SocialLinks() {
  const links = [
    { label: "Facebook", href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK },
    { label: "Instagram", href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM },
    { label: "X", href: process.env.NEXT_PUBLIC_SOCIAL_X },
    { label: "LinkedIn", href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  const pill = "rounded-full border border-white/15 px-3 py-1.5 text-ink-foreground/80 transition-colors hover:border-white/40 hover:text-white";
  return (
    <div className="mt-5 inline-flex flex-wrap gap-2 text-sm">
      <a href="mailto:info@gapcastle.com" className={pill}>info@gapcastle.com</a>
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={pill}>{link.label}</a>
      ))}
    </div>
  );
}
