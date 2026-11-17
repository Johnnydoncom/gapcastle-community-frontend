import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordPage } from "@/components/routes/reset-password-page";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Gratis Castle account.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
