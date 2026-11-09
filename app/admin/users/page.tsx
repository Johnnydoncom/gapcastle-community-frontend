import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminMembersPage } from "@/components/admin/members-admin-page";

export const metadata: Metadata = { title: "Members" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminMembersPage scope="members" />
    </Suspense>
  );
}
