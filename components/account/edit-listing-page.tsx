"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeading } from "@/components/account/account-shell";
import { ListingForm } from "@/components/listing-form";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Listing } from "@/lib/types";

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ["listing-edit", id],
    queryFn: async () => (await api.get<{ data: Listing }>(`listings/${id}`)).data,
  });

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-muted" />;
  if (error || !data || !data.is_owner) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">You can&apos;t edit this listing</h1>
        <Button asChild className="mt-6"><Link href="/account/listings">Back to my listings</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeading eyebrow="Edit listing" title={data.title} />
      <ListingForm initial={data} onSaved={(listing, message) => {
        toast.success(message);
        router.push(`/account/listings?listing=${listing.id}`);
      }} />
    </div>
  );
}
