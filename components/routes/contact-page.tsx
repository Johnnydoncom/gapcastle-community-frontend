import { Clock, Mail, MapPin, MessageCircle, Phone, ShieldAlert } from "lucide-react";
import { Suspense } from "react";
import { ContactForm } from "@/components/contact/contact-form";
import { DEFAULT_EMAIL, whatsappLink } from "@/components/site/footer-info";
import { getSiteInfo } from "@/lib/server/api";

/** Server-rendered contact page; only the form is a client island. Contact details come from Admin › Settings. */
export async function ContactPage() {
  const site = await getSiteInfo().then((response) => response.data).catch(() => null);
  const email = site?.contact_email || DEFAULT_EMAIL;
  const phone = site ? site.contact_phone : "+234 201 887 6442";
  const whatsapp = site?.whatsapp_number ? whatsappLink(site.whatsapp_number) : null;
  return (
    <div className="container-page py-10">
      <p className="text-sm font-semibold text-primary">Contact us</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">We&apos;d love to hear from you</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">Questions, feedback or a safety concern? Send us a message and the Gratis Castle team will reply by email.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-muted" />}>
          <ContactForm />
        </Suspense>
        <aside className="space-y-4">
          <div className="rounded-2xl bg-cream p-6">
            <p className="flex items-center gap-2 font-semibold"><Mail className="size-4 text-primary" /> Email</p>
            <a href={`mailto:${email}`} className="mt-1 block text-muted-foreground hover:text-primary">{email}</a>
            {phone && (
              <>
                <p className="mt-4 flex items-center gap-2 font-semibold"><Phone className="size-4 text-primary" /> Phone</p>
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-1 block text-muted-foreground hover:text-primary">{phone}</a>
              </>
            )}
            {whatsapp && site && (
              <>
                <p className="mt-4 flex items-center gap-2 font-semibold"><MessageCircle className="size-4 text-primary" /> WhatsApp</p>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 block text-muted-foreground hover:text-primary">{site.whatsapp_number}</a>
              </>
            )}
            {site?.support_hours && (
              <>
                <p className="mt-4 flex items-center gap-2 font-semibold"><Clock className="size-4 text-primary" /> Support hours</p>
                <p className="mt-1 text-muted-foreground">{site.support_hours}</p>
              </>
            )}
            {site?.office_address && (
              <>
                <p className="mt-4 flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" /> Office</p>
                <p className="mt-1 text-muted-foreground">{site.office_address}</p>
              </>
            )}
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
