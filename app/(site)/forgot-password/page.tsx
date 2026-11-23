import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { FORGOT_PASSWORD_PATH, LOGIN_PATH } from "@/lib/auth-paths";

export const metadata: Metadata = {
  title: "Forgot your password?",
  description: "Reset your Gratis Castle password. Enter your email and we'll send you a secure link to set a new one.",
  alternates: { canonical: FORGOT_PASSWORD_PATH },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you joined with and we'll send you a link to set a new password."
      footer={
        <p>
          Remembered it? <Link href={LOGIN_PATH} className="font-semibold text-primary hover:underline">Back to sign in</Link>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
