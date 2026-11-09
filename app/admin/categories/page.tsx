import type { Metadata } from "next";
import { AdminCategoriesPage } from "@/components/admin/management-pages";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage marketplace categories.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminCategoriesPage />;
}
