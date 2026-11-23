import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminEditListingPage } from "@/components/admin/edit-listing-admin-page";

export const metadata: Metadata = { title: "Edit listing" };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<EditListingSkeleton />}>
      <AdminEditListingPage listingId={id} />
    </Suspense>
  );
}

function EditListingSkeleton() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6 h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
