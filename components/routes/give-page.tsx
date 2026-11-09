"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { useState } from "react";
import { ListingForm } from "@/components/listing-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { listingPath } from "@/lib/site";
import type { Listing } from "@/lib/types";

// Based on gapcastle-lovable/src/routes/give.tsx.
export function GivePage() {
  const { userId, loading } = useAuth();
  const [published, setPublished] = useState<{ listing: Listing; message: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (published) {
    const live = published.listing.moderation_status !== "pending";
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-highlight/25 text-3xl">🎁</span>
          <h1 className="text-3xl font-bold">{live ? "Your item is live!" : "Thanks for sharing!"}</h1>
          <p className="mt-2 text-muted-foreground">
            {live ? "Members can now find it and send you requests. You'll get a notification each time someone does." : published.message}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href={listingPath(published.listing.slug)}>View listing</Link></Button>
            <Button size="lg" variant="outline" onClick={() => { setPublished(null); setFormKey((key) => key + 1); }}>Give another</Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="container-page max-w-3xl py-10"><div className="h-96 animate-pulse rounded-2xl bg-muted" /></div>;

  if (!userId) {
    return (
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Gift className="size-8" /></span>
          <h1 className="text-3xl font-bold">Sign in to give an item</h1>
          <p className="mt-2 text-muted-foreground">Create a free account so neighbours can find your listing and request it.</p>
          <Button asChild size="lg" className="mt-6"><Link href={`/auth?next=${encodeURIComponent("/give")}`}>Sign in or join</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="mb-8 text-center">
        <Badge variant="free" className="mb-3">100% free, always</Badge>
        <h1 className="text-3xl font-bold tracking-tight">Someone could use what you no longer need.</h1>
        <p className="mt-2 text-muted-foreground">Share it with your community. It&apos;s free, simple, and meaningful.</p>
      </div>
      <ListingForm key={formKey} onSaved={(listing, message) => setPublished({ listing, message })} />
    </div>
  );
}
