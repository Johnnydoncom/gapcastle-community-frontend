import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Gratis Castle Admin" },
  robots: { index: false, follow: false },
};

/** The admin dashboard has its own app layout (sidebar + top bar), separate from the public site. */
export default function Layout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
