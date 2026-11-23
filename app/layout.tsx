import type { Metadata, Viewport } from "next";
import { Anton, Inter, Lora } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/** UI and body text: Inter (variable weight) — highly legible at the small sizes a marketplace relies on. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Brand wordmark: the heavy condensed capitals of the official Gratis Castle lockup. */
const wordmark = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

/** Brand tagline: the italic serif of "give freely, receive gratefully…". */
const tagline = Lora({
  subsets: ["latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Gratis Castle — Free items across Nigeria",
    template: "%s — Gratis Castle",
  },
  description: "Discover useful things shared freely by people across Nigeria. Give your unused items a new home or find something you need, completely free.",
  applicationName: "Gratis Castle",
  authors: [{ name: "Gratis Castle Limited" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Gratis Castle",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Gratis Castle",
    description: "Give freely. Receive gratefully. Build community.",
    type: "website",
    siteName: "Gratis Castle",
    locale: "en_NG",
    images: [{ url: "/brand/logo-lockup-768x553.png", width: 768, height: 553, alt: "Gratis Castle" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#144a96" },
    { media: "(prefers-color-scheme: dark)", color: "#010d25" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${inter.variable} ${wordmark.variable} ${tagline.variable}`}>
      <body>
        <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <PwaRegister />
        <SiteJsonLd />
      </body>
    </html>
  );
}
