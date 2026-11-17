import type { Metadata } from "next";
import { ContactPage } from "@/components/routes/contact-page";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions, feedback or a safety concern? Get in touch with the Gratis Castle team.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
