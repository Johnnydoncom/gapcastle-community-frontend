import type { Metadata } from "next";
import { withSeoOverrides } from "@/lib/server/page-metadata";
import { ContactPage } from "@/components/routes/contact-page";
import { PageJsonLd } from "@/components/seo/page-json-ld";
import { contactPageJsonLd, breadcrumbJsonLd } from "@/lib/seo";

const baseMetadata: Metadata = {
  title: "Contact us — Gratis Castle Nigeria",
  description: "Questions, feedback or a safety concern? Get in touch with the Gratis Castle team. We're here to help with your free items experience in Nigeria.",
  alternates: { canonical: "/contact" },
  keywords: ["contact Gratis Castle", "Gratis Castle support", "free marketplace help Nigeria"],
};

/** Built-in metadata, with any overrides saved in Admin › Pages & SEO on top. */
export function generateMetadata(): Promise<Metadata> {
  return withSeoOverrides("contact", baseMetadata);
}

export default function Page() {
  return (
    <>
      <ContactPage />
      <PageJsonLd
        pageKey="contact"
        data={[
          contactPageJsonLd(),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Contact us", url: "/contact" },
          ]),
        ]}
      />
    </>
  );
}
