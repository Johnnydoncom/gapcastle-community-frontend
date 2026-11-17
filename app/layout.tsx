import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={jakarta.variable}>
      <body>
        <a href="#main" className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
