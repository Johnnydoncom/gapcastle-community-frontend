import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifiedStatus } from "@/components/verified-status";

export const metadata: Metadata = { title: "Email verification", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense>
      <VerifiedStatus />
    </Suspense>
  );
}
