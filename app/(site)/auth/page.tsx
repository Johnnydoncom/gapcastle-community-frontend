import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPage } from "@/components/routes/auth-page";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or join Gap Castle Community to give and receive free items.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <AuthPage />
    </Suspense>
  );
}
