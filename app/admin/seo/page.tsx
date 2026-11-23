import type { Metadata } from "next";
import { AdminSeoPage } from "@/components/admin/seo-page";

export const metadata: Metadata = { title: "SEO settings" };

export default function Page() {
  return <AdminSeoPage />;
}
