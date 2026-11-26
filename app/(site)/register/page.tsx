import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { KeepNextLink } from "@/components/auth/auth-fields";
import { RegisterForm } from "@/components/auth/register-form";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/auth-paths";

const title = "Join free — create your account";
const description = "Create a free Gratis Castle account to give away items you no longer need and claim free items near you in Nigeria. Items are always free — collect free at our pickup hub, or choose delivery at your cost.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: REGISTER_PATH },
  openGraph: { title: `${title} — Gratis Castle`, description, url: REGISTER_PATH },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <AuthCard
      wide
      title="Join the community"
      description="Create a free account to give and receive."
      footer={
        <p>
          Already a member?{" "}
          <KeepNextLink href={LOGIN_PATH} className="font-semibold text-primary hover:underline">Sign in</KeepNextLink>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
