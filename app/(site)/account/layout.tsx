import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: LayoutProps<"/account">) {
  return (
    <Suspense fallback={<div className="container-page py-12"><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>}>
      <AccountShell>{children}</AccountShell>
    </Suspense>
  );
}
