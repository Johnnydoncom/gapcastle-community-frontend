import { getSiteInfo } from "@/lib/server/api";
import type { SiteInfo } from "@/lib/types";

const DEFAULT_ABOUT = "A free community marketplace where good things find a second home. Give or pick an item for free.";
const DEFAULT_EMAIL = "info@gapcastle.com";

const SOCIALS: Array<{ key: keyof SiteInfo; label: string }> = [
  { key: "social_facebook", label: "Facebook" },
  { key: "social_instagram", label: "Instagram" },
  { key: "social_x", label: "X" },
  { key: "social_linkedin", label: "LinkedIn" },
  { key: "social_tiktok", label: "TikTok" },
  { key: "social_youtube", label: "YouTube" },
];

/** Digits only, for wa.me links. Nigerian numbers starting with 0 get the 234 country code. */
export function whatsappLink(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
}

async function siteInfo(): Promise<SiteInfo | null> {
  return getSiteInfo().then((response) => response.data).catch(() => null);
}

/** The footer blurb under the logo, editable in Admin › Settings. */
export async function FooterAbout() {
  const site = await siteInfo();
  return <>{site?.footer_about || DEFAULT_ABOUT}</>;
}

/** Contact email, WhatsApp and social profile links, editable in Admin › Settings. */
export async function FooterLinks() {
  const site = await siteInfo();
  const email = site?.contact_email || DEFAULT_EMAIL;
  const whatsapp = site?.whatsapp_number ? whatsappLink(site.whatsapp_number) : null;
  const links = SOCIALS.map((social) => ({ label: social.label, href: site?.[social.key] ?? "" })).filter((link) => link.href.startsWith("https://"));
  const pill = "rounded-full border border-white/15 px-3 py-1.5 text-ink-foreground/80 transition-colors hover:border-white/40 hover:text-white";

  return (
    <>
      <a href={`mailto:${email}`} className={pill}>{email}</a>
      {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={pill}>WhatsApp</a>}
      {links.map((link) => (
        <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={pill}>{link.label}</a>
      ))}
    </>
  );
}

export { DEFAULT_ABOUT, DEFAULT_EMAIL };
