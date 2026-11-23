import Link from "next/link";
import { LayoutGrid, MapPin } from "lucide-react";
import { categoryIcon } from "@/lib/gapcastle";
import { getCategories } from "@/lib/server/api";
import { categoryPath } from "@/lib/site";
import type { Category } from "@/lib/types";

/**
 * The marketplace category strip under the header (desktop). Rendered on the
 * server so category links are in the initial HTML for every page.
 */
export async function CategoryNav() {
  const categories: Category[] = await getCategories()
    .then((response) => response.data)
    .catch(() => []);

  return (
    <nav aria-label="Categories" className="container-page flex h-11 items-center gap-1 text-sm">
      <Link href="/categories" className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-primary-50 px-3 font-semibold text-primary-700 transition-colors hover:bg-primary-100">
        <LayoutGrid className="size-4" /> All categories
      </Link>
      <ul className="scrollbar-none flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {categories.map((category) => {
          const Icon = categoryIcon(category.icon);
          return (
            <li key={category.id} className="shrink-0">
              <Link href={categoryPath(category.slug)} className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Icon className="size-3.5" /> {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/pickup-hubs" className="hidden h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 font-semibold text-primary transition-colors hover:bg-primary-50 xl:inline-flex">
        <MapPin className="size-4" /> Pickup hub
      </Link>
    </nav>
  );
}

export function CategoryNavSkeleton() {
  return (
    <div className="container-page flex h-11 items-center gap-2" aria-hidden="true">
      <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-5 w-20 animate-pulse rounded bg-muted" />)}
    </div>
  );
}
