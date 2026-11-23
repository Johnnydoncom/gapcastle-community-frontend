import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSeoPage } from "@/components/admin/seo-page";

export const metadata: Metadata = { title: "Pages & SEO", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminSeoPage />
    </Suspense>
  );
}
