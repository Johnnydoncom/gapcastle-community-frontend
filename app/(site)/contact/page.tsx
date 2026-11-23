import type { Metadata } from "next";
import { ContactPage } from "@/components/routes/contact-page";
import { JsonLd } from "@/components/seo/json-ld";
import { contactPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact us — Gratis Castle Nigeria",
  description: "Questions, feedback or a safety concern? Get in touch with the Gratis Castle team. We're here to help with your free items experience in Nigeria.",
  alternates: { canonical: "/contact" },
  keywords: ["contact Gratis Castle", "Gratis Castle support", "free marketplace help Nigeria"],
};

export default function Page() {
  return (
    <>
      <ContactPage />
      <JsonLd data={contactPageJsonLd()} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        { name: "Contact us", url: "/contact" },
      ])} />
    </>
  );
}
