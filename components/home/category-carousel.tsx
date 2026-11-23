import Link from "next/link";
import { createElement } from "react";
import { ArrowUpRight, LayoutGrid, Wrench } from "lucide-react";
import { ScrollRail } from "@/components/home/scroll-rail";
import { categoryIcon } from "@/lib/gapcastle";
import { categoryPath } from "@/lib/site";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Soft tints for the icon boxes, cycled across categories. Brand blue and yellow
 * lead; a few gentle accents keep a long row lively without shouting.
 */
const TINTS = [
  { box: "bg-primary-50 text-primary-700", ring: "group-hover:ring-primary-200" },
  { box: "bg-brand-yellow-100 text-brand-yellow-800", ring: "group-hover:ring-brand-yellow-300" },
  { box: "bg-emerald-50 text-emerald-700", ring: "group-hover:ring-emerald-200" },
  { box: "bg-rose-50 text-rose-600", ring: "group-hover:ring-rose-200" },
  { box: "bg-violet-50 text-violet-700", ring: "group-hover:ring-violet-200" },
  { box: "bg-sky-50 text-sky-700", ring: "group-hover:ring-sky-200" },
  { box: "bg-amber-50 text-amber-700", ring: "group-hover:ring-amber-200" },
  { box: "bg-teal-50 text-teal-700", ring: "group-hover:ring-teal-200" },
];

const itemClass = "w-[34%] shrink-0 snap-start min-[480px]:w-[25%] sm:w-[19%] lg:w-[calc((100%-6*1rem)/7.3)]";

/**
 * "Shop by category": a sliding row of icon boxes. Rendered on the server (every
 * category link is in the initial HTML); ScrollRail only adds sliding.
 */
export function CategoryCarousel({ categories }: { categories: Category[] }) {
  return (
    <ScrollRail label="Categories" autoplay>
      {categories.map((category, index) => (
        <li key={category.id} className={itemClass}>
          <CategoryTile category={category} tint={TINTS[index % TINTS.length]} />
        </li>
      ))}
      <li className={itemClass}>
        <Link
          href="/categories"
          className="group flex h-full min-h-36 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-primary-200 bg-primary-50/40 p-4 text-center transition-colors hover:border-primary hover:bg-primary-50"
        >
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <LayoutGrid className="size-6" />
          </span>
          <span className="text-sm font-semibold text-primary">All categories</span>
        </Link>
      </li>
    </ScrollRail>
  );
}

function CategoryTile({ category, tint }: { category: Category; tint: (typeof TINTS)[number] }) {
  const isRepair = category.slug === "damaged-but-valuable";

  return (
    <Link
      href={categoryPath(category.slug)}
      className="group relative flex h-full min-h-36 flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card px-3 py-5 text-center transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
    >
      {/* A faint corner bloom in the same tint gives each card depth. */}
      <span aria-hidden="true" className={cn("absolute -right-8 -top-8 size-24 rounded-full opacity-40 transition-transform duration-500 group-hover:scale-125", tint.box)} />

      <span className={cn("relative flex size-14 items-center justify-center rounded-2xl ring-4 ring-transparent transition-[transform,box-shadow] duration-300 group-hover:-rotate-6 group-hover:scale-110 sm:size-16", tint.box, tint.ring)}>
        {createElement(categoryIcon(category.icon), { className: "size-6 sm:size-7", strokeWidth: 1.75 })}
      </span>

      <span className="relative mt-3 line-clamp-2 text-sm font-semibold leading-snug">{category.name}</span>

      {isRepair ? (
        <span className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-highlight px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-highlight-foreground">
          <Wrench className="size-3" /> Repair & reuse
        </span>
      ) : (
        <ArrowUpRight aria-hidden="true" className="absolute right-3 top-3 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </Link>
  );
}
