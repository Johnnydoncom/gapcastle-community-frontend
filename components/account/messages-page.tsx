"use client";
import Image from "next/image";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, Ban, Flag, ImagePlus, MessageCircle, MoreVertical, Send, X } from "lucide-react";
import { toast } from "sonner";
import { RequestStatusBadge } from "@/components/account/status-badges";
import { ReportDialog } from "@/components/report-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/form-fields";
import { SESSION_KEY } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, api } from "@/lib/api";
import { timeAgo } from "@/lib/gapcastle";
import { listingPath, profilePath } from "@/lib/site";

type ApiConversation = {
  id: number;
  giver_id: number;
  requester_id: number;
  last_message_at: string;
  unread: boolean;
  listing_id: number | null;
  listing: { slug: string; title: string; location: string } | null;
  giver: { slug: string; name: string; avatar_url: string | null };
  requester: { slug: string; name: string; avatar_url: string | null };
  request: { id: number; status: string; fulfillment_method: string } | null;
  other_user_id: number;
  other_user_slug: string;
};

type MessageRow = { id: number; sender_id: number | null; body: string | null; image_url: string | null; is_system: boolean; created_at: string };

// Based on gapcastle-lovable/src/routes/messages.tsx.
export function MessagesPage() {
  const conversationId = useSearchParams().get("conversationId") ?? undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const me = Number(userId);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await api.get<{ data: ApiConversation[] }>("conversations")).data,
    refetchInterval: 15_000,
  });
  const selectedId = conversationId ?? (conversations.data?.[0] ? String(conversations.data[0].id) : undefined);
  const selected = conversations.data?.find((conversation) => String(conversation.id) === selectedId);
  const messages = useQuery({
    queryKey: ["conversation-messages", selectedId],
    enabled: !!selectedId,
    refetchInterval: 5_000,
    queryFn: async () => (await api.get<{ data: MessageRow[] }>(`conversations/${selectedId}/messages`)).data,
  });
  const other = useMemo(() => selected && (selected.giver_id === me ? selected.requester : selected.giver), [selected, me]);
  const iAmGiver = selected?.giver_id === me;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length, selectedId]);

  useEffect(() => {
    if (messages.isSuccess) {
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [messages.isSuccess, selectedId, queryClient]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!selectedId || (!body && !image) || sending) return;
    setSending(true);
    try {
      if (image) {
        const form = new FormData();
        if (body) form.append("body", body);
        form.append("image", image);
        await api.post(`conversations/${selectedId}/messages`, form);
      } else {
        await api.post(`conversations/${selectedId}/messages`, { body });
      }
      setDraft("");
      setImage(null);
      await queryClient.invalidateQueries({ queryKey: ["conversation-messages", selectedId] });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      toast.error(err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Message not sent — please try again");
    } finally {
      setSending(false);
    }
  }

  async function block() {
    if (!selected || !other || !confirm(`Block ${other.name}? They won't be able to message you or request your items.`)) return;
    try {
      const response = await api.post<{ message: string }>(`users/${selected.other_user_id}/block`);
      toast.success(response.message);
    } catch {
      toast.error("Could not block this member");
    }
  }

  return <div>
    <div className="mb-5"><p className="text-sm font-semibold text-primary">Make a plan</p><h1 className="mt-1 text-3xl font-bold">Messages</h1></div>
    <div className="grid min-h-[600px] overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-[280px_minmax(0,1fr)]">
      <aside className={`${selected && conversationId ? "hidden md:block" : "block"} border-r border-border`}>
        <div className="border-b border-border px-4 py-4"><h2 className="font-semibold">Conversations</h2><p className="mt-1 text-xs text-muted-foreground">Item requests and neighbour chats</p></div>
        {conversations.isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}</div> : conversations.data?.length ? <div className="max-h-[540px] divide-y divide-border overflow-y-auto">{conversations.data.map((conversation) => {
          const person = conversation.giver_id === me ? conversation.requester : conversation.giver;
          const isActive = selectedId === String(conversation.id);
          return <button key={conversation.id} type="button" onClick={() => router.push(`/account/messages?conversationId=${conversation.id}`)} className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${isActive ? "bg-cream" : "hover:bg-muted/60"}`}>
            <Avatar url={person.avatar_url} name={person.name} />
            <span className="min-w-0 flex-1"><span className={`block truncate text-sm ${conversation.unread && !isActive ? "font-bold" : "font-semibold"}`}>{person.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{conversation.listing?.title ?? "Neighbour chat"}</span></span>
            <span className="flex shrink-0 flex-col items-end gap-1"><span className="text-[11px] text-muted-foreground">{timeAgo(conversation.last_message_at)}</span>{conversation.unread && !isActive && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}</span>
          </button>;
        })}</div> : <div className="px-5 py-12 text-center"><MessageCircle className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No messages yet</p><p className="mt-1 text-sm text-muted-foreground">Request an item to start a conversation.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link href="/explore">Explore items</Link></Button></div>}
      </aside>

      <section className={`${selected && conversationId ? "flex" : "hidden md:flex"} min-h-[600px] flex-col`} aria-label="Conversation">
        {selected && other ? <>
          <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => router.push("/account/messages")} aria-label="Back to conversations"><ArrowLeft className="size-4" /></Button>
            <Avatar url={other.avatar_url} name={other.name} />
            <div className="min-w-0 flex-1">
              <Link href={profilePath(selected.other_user_slug)} className="truncate font-semibold hover:text-primary">{other.name}</Link>
              {selected.listing && <p className="truncate text-xs text-muted-foreground">About <Link href={listingPath(selected.listing.slug)} className="text-primary">{selected.listing.title}</Link></p>}
            </div>
            {selected.request && <span className="hidden sm:block"><RequestStatusBadge status={selected.request.status} /></span>}
            {selected.request && (
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link href={iAmGiver ? `/account/listings?listing=${selected.listing_id}` : "/account/requests"}>{iAmGiver ? "Manage request" : "View request"}</Link>
              </Button>
            )}
            <ConversationMenu conversationId={selected.id} onBlock={block} />
          </header>
          <div className="max-h-[480px] flex-1 space-y-3 overflow-y-auto bg-background px-4 py-5 sm:px-6">
            {messages.data?.length ? messages.data.map((message) => message.is_system ? (
              <p key={message.id} className="mx-auto max-w-md rounded-full bg-accent/50 px-4 py-1.5 text-center text-xs text-accent-foreground">{message.body}</p>
            ) : (
              <div key={message.id} className={`flex ${message.sender_id === me ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] overflow-hidden rounded-xl text-sm ${message.sender_id === me ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {message.image_url && <a href={message.image_url} target="_blank" rel="noreferrer"><Image src={message.image_url} alt="Shared photo" width={640} height={480} sizes="(min-width: 640px) 420px, 85vw" className="h-auto max-h-64 w-full object-cover" /></a>}
                  <div className="px-4 py-3">
                    {message.body && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                    <p className={`mt-1 text-[10px] ${message.sender_id === me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{timeAgo(message.created_at)}</p>
                  </div>
                </div>
              </div>
            )) : <p className="py-10 text-center text-sm text-muted-foreground">Say hello and arrange a time that works for both of you.</p>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={sendMessage} className="border-t border-border p-3 sm:p-4">
            {image && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
                <ImagePlus className="size-3.5" /> {image.name}
                <button type="button" onClick={() => setImage(null)} aria-label="Remove photo"><X className="size-3.5" /></button>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} aria-label="Attach a photo"><ImagePlus className="size-4" /></Button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 5 * 1024 * 1024) toast.error("Photos must be 5 MB or smaller");
                else setImage(file ?? null);
                e.target.value = "";
              }} />
              <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Write a message" maxLength={2000} />
              <Button type="submit" disabled={(!draft.trim() && !image) || sending} aria-label="Send message"><Send className="size-4" /><span className="hidden sm:inline">Send</span></Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Keep chats on Gratis Castle, never send money for an item, and never share your home address — Gratis Castle handles every handover.</p>
          </form>
        </> : <div className="m-auto max-w-sm px-6 text-center"><MessageCircle className="mx-auto size-10 text-primary" /><h2 className="mt-4 text-xl font-bold">Good things start with hello</h2><p className="mt-2 text-sm text-muted-foreground">Choose a conversation to talk about pickup, delivery, and the item’s next home.</p></div>}
      </section>
    </div>
  </div>;
}

function ConversationMenu({ conversationId, onBlock }: { conversationId: number; onBlock: () => void }) {
  return (
    <ReportDialog type="conversation" id={conversationId} trigger={(openReport) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Conversation options"><MoreVertical className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openReport}><Flag className="size-4" /> Report conversation</DropdownMenuItem>
          <DropdownMenuItem onSelect={onBlock}><Ban className="size-4" /> Block member</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )} />
  );
}
