"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { PageHeading } from "@/components/account/account-shell";
import { ItemCard } from "@/components/items/item-card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toListingRow } from "@/lib/gapcastle";
import type { Listing, Paginated } from "@/lib/types";

export function SavedPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["saved"], queryFn: async () => (await api.get<Paginated<Listing>>("saved")).data });
  const rows = (data ?? []).map(toListingRow);

  return (
    <div>
      <PageHeading eyebrow="Saved items" title="Saved for later" description="Good finds you’d like to remember." />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : rows.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {rows.map((listing) => (
            <ItemCard key={listing.id} listing={listing} saved onSavedChange={() => void queryClient.invalidateQueries({ queryKey: ["saved"] })} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Bookmark className="mx-auto size-9 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nothing saved yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap the heart on any item to keep it here.</p>
          <Button asChild variant="outline" className="mt-4"><Link href="/explore">Explore free items</Link></Button>
        </div>
      )}
    </div>
  );
}
