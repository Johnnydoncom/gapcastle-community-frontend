import { Mail, Phone, ShieldAlert } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

/** Server-rendered contact page; only the form is a client island. */
export function ContactPage() {
  return (
    <div className="container-page py-10">
      <p className="text-sm font-semibold text-primary">Contact us</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">We&apos;d love to hear from you</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Questions, feedback or a safety concern? Send us a message and the Gratis Castle team will reply by email.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ContactForm />
        <aside className="space-y-4">
          <div className="rounded-2xl bg-cream p-6">
            <p className="flex items-center gap-2 font-semibold"><Mail className="size-4 text-primary" /> Email</p>
            <a href="mailto:info@gapcastle.com" className="mt-1 block text-muted-foreground hover:text-primary">info@gapcastle.com</a>
            <p className="mt-4 flex items-center gap-2 font-semibold"><Phone className="size-4 text-primary" /> Phone</p>
            <a href="tel:+2342018876442" className="mt-1 block text-muted-foreground hover:text-primary">+234 201 887 6442</a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="flex items-center gap-2 font-semibold"><ShieldAlert className="size-4 text-primary" /> Feel unsafe?</p>
            <p className="mt-1 text-sm text-muted-foreground">Stop the handoff and contact local authorities first. Then report the listing, member or conversation so our moderators can act.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
