import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailPage } from "@/components/routes/verify-email-page";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Confirm your email address with the 6-digit code we sent you.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailPage />
    </Suspense>
  );
}
