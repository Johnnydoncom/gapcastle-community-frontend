import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/** Shown by the service worker when a page can't be loaded without a connection. */
export default function OfflinePage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary"><WifiOff className="size-8" /></span>
        <h1 className="mt-5 text-2xl font-extrabold">You&apos;re offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">Check your connection and try again. Pages you opened recently may still be available.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground">Try again</Link>
      </div>
    </div>
  );
}
