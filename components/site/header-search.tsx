"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = { className?: string; compact?: boolean; autoFocus?: boolean };

/** Prefills from the current URL so the header always reflects the active search. */
export function ActiveHeaderSearch(props: Props) {
  const params = useSearchParams();
  return <HeaderSearch key={`${params.get("q")}-${params.get("category")}`} initialQuery={params.get("q") ?? ""} initialCategory={params.get("category") ?? ""} {...props} />;
}

/**
 * The marketplace search bar: category scope + keyword. Submits to /explore,
 * which owns all filtering.
 */
export function HeaderSearch({
  className,
  compact = false,
  autoFocus = false,
  initialQuery = "",
  initialCategory = "",
}: Props & { initialQuery?: string; initialCategory?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ data: Category[] }>("categories").then((response) => response.data),
    staleTime: 5 * 60_000,
    enabled: !compact,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    router.push(`/explore${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-xl border-2 border-primary bg-card transition-shadow focus-within:shadow-[0_0_0_4px] focus-within:shadow-primary/15",
        className,
      )}
    >
      {!compact && (
        <label className="relative hidden shrink-0 border-r border-border bg-muted/60 lg:block">
          <span className="sr-only">Search in category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-full max-w-44 cursor-pointer appearance-none bg-transparent pl-3.5 pr-8 text-sm font-medium text-foreground outline-none"
          >
            <option value="">All categories</option>
            {categories?.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
        </label>
      )}
      <label className="flex min-w-0 flex-1 items-center gap-2.5 pl-3.5">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Search free items</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search free items, e.g. study desk, stroller…"
          autoFocus={autoFocus}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      <button type="submit" className="shrink-0 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700 sm:px-6">
        <span className="hidden sm:inline">Search</span>
        <Search className="size-4 sm:hidden" aria-label="Search" />
      </button>
    </form>
  );
}
