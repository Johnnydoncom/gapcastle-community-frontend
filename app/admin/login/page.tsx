import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginPage } from "@/components/admin/admin-login-page";

export const metadata: Metadata = {
  title: "Admin sign in",
  description: "Sign in to the Gratis Castle admin console.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <AdminLoginPage />
    </Suspense>
  );
}
