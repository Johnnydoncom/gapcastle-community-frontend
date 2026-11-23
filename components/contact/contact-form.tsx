"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form-fields";
import { useSession } from "@/hooks/use-session";
import { ApiError, api } from "@/lib/api";

/** The contact form is the only interactive part of the contact page. */
const TOPICS = ["general", "safety", "account", "partnership", "other"];

export function ContactForm() {
  const { user } = useSession();
  // Deep links such as /contact?topic=safety (the "Report" button on the safety banner) preselect the topic.
  const requestedTopic = useSearchParams().get("topic");
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    topic: requestedTopic && TOPICS.includes(requestedTopic) ? requestedTopic : "general",
    message: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { website, ...payload } = form;
      await api.post("contact", website ? form : payload);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? (Object.values(err.errors)[0]?.[0] ?? err.message) : "Could not send your message");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-highlight/25 text-2xl">✉️</span>
        <h2 className="text-xl font-bold">Message sent</h2>
        <p className="mt-2 text-muted-foreground">Thanks for getting in touch — we&apos;ll reply to {form.email} soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ct-name">Your name</Label>
          <Input id="ct-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ct-email">Email</Label>
          <Input id="ct-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ct-topic">Topic</Label>
        <Select id="ct-topic" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}>
          <option value="general">General question</option>
          <option value="safety">Safety concern</option>
          <option value="account">My account</option>
          <option value="partnership">Partnerships</option>
          <option value="other">Something else</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ct-message">Message</Label>
        <Textarea id="ct-message" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required minLength={10} maxLength={3000} rows={6} />
      </div>
      <input type="text" name="website" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <Button type="submit" size="lg" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button>
    </form>
  );
}
