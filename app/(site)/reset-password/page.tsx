import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/form-fields";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth-paths";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Set a new password for your Gratis Castle account.",
  robots: { index: false, follow: false },
};

/** Landing page for the emailed reset link: /reset-password?token=…&email=… */
export default function Page({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthCard title="Set a new password" description="Choose a new password for your account.">
      <Suspense fallback={<FormSkeleton />}>
        <ResetFromLink searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function ResetFromLink({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const email = typeof params.email === "string" ? params.email : "";

  if (!token || !email) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">This page only works from the password reset link we email you. The link may be incomplete — request a new one below.</p>
        <Button asChild size="lg" className="mt-5 w-full"><Link href={FORGOT_PASSWORD_PATH}>Request a reset link</Link></Button>
      </div>
    );
  }

  return <ResetPasswordForm token={token} email={email} />;
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
    </div>
  );
}
