"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Clock3, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_KEY } from "@/hooks/use-session";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";

type NotificationRow = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

// Based on gapcastle-lovable/src/routes/notifications.tsx.
export function NotificationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<{ data: NotificationRow[] }>("notifications")).data,
    refetchInterval: 30_000,
  });
  const unread = (notifications.data ?? []).filter((notification) => !notification.read);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  }

  async function markAllRead() {
    if (!unread.length) return;
    await api.post("notifications/read-all").catch(() => undefined);
    await refresh();
  }

  async function openNotification(notification: NotificationRow) {
    if (!notification.read) {
      await api.post(`notifications/${notification.id}/read`).catch(() => undefined);
      await refresh();
    }
    const link = notification.link;
    if (link && link.startsWith("/") && !link.startsWith("//")) router.push(link);
  }

  return <div className="max-w-4xl">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6"><div><p className="text-sm font-semibold text-primary">Stay in the loop</p><h1 className="mt-1 text-3xl font-bold">Notifications</h1><p className="mt-2 text-muted-foreground">{unread.length ? `${unread.length} new update${unread.length === 1 ? "" : "s"}` : "You’re all caught up."}</p></div><Button variant="outline" onClick={markAllRead} disabled={!unread.length}><CheckCheck className="size-4" /> Mark all as read</Button></div>
    {notifications.isLoading ? <div className="mt-6 h-48 animate-pulse rounded-lg bg-muted" /> : notifications.data?.length ? <div className="divide-y divide-border">{notifications.data.map((notification) => <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`flex w-full items-start gap-4 px-2 py-5 text-left transition-colors hover:bg-cream ${notification.read ? "" : "bg-accent/20"}`}><span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full ${notification.read ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}><Bell className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-semibold">{notification.title}{!notification.read && <span className="size-2 rounded-full bg-primary" />}</span>{notification.body && <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{notification.body}</span>}<span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" />{timeAgo(notification.created_at)}</span></span></button>)}</div> : <div className="py-16 text-center"><PackageSearch className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">Nothing to notify you about yet</h2><p className="mt-1 text-sm text-muted-foreground">When there’s an update, you’ll find it here.</p><Button asChild variant="outline" className="mt-5"><Link href="/explore">Explore free items</Link></Button></div>}
  </div>;
}
