import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { KeepNextLink } from "@/components/auth/auth-fields";
import { LoginForm } from "@/components/auth/login-form";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/auth-paths";

const title = "Sign in";
const description = "Sign in to your free Gratis Castle account to claim free items, give away things you no longer need and chat with the community across Nigeria.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: LOGIN_PATH },
  openGraph: { title: `${title} — Gratis Castle`, description, url: LOGIN_PATH },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to request items and manage your listings."
      footer={
        <p>
          New to Gratis Castle?{" "}
          <KeepNextLink href={REGISTER_PATH} className="font-semibold text-primary hover:underline">Join the community</KeepNextLink>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
