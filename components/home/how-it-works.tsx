"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bike, Camera, Gift, HandHeart, PackageCheck, PackageSearch, ShieldCheck, ShoppingBag, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Journey = {
  key: "get" | "give";
  tab: string;
  short: string;
  icon: LucideIcon;
  cta: { href: string; label: string };
  steps: { icon: LucideIcon; title: string; text: string }[];
};

const JOURNEYS: Journey[] = [
  {
    key: "get",
    tab: "Getting an item",
    short: "Getting",
    icon: ShoppingBag,
    cta: { href: "/explore", label: "Find something free" },
    steps: [
      { icon: PackageSearch, title: "Find it", text: "Browse free items near you." },
      { icon: HandHeart, title: "Check out for ₦0", text: "No approval needed. Delivery is free too." },
      { icon: PackageCheck, title: "Collect or receive", text: "Pick up at our hub, or we deliver to you." },
    ],
  },
  {
    key: "give",
    tab: "Giving an item",
    short: "Giving",
    icon: Gift,
    cta: { href: "/give", label: "Give an item" },
    steps: [
      { icon: Camera, title: "List it", text: "Add photos and details in 2 minutes." },
      { icon: Sparkles, title: "Someone claims it", text: "We let you know straight away." },
      { icon: Bike, title: "Hand it over", text: "Drop it at our hub, or our rider collects it." },
    ],
  },
];

/**
 * "How It Works" — one journey at a time (getting / giving) as three airy steps.
 * Both journeys are in the server HTML for SEO; the switch only toggles visibility.
 */
export function HowItWorksSteps() {
  const [active, setActive] = useState<Journey["key"]>("get");

  return (
    <div className="rounded-3xl border border-border bg-card px-5 py-8 sm:px-10 sm:py-12">
      <div role="tablist" aria-label="How it works" className="mx-auto flex w-fit rounded-full bg-muted p-1">
        {JOURNEYS.map((journey) => {
          const selected = active === journey.key;
          return (
            <button
              key={journey.key}
              type="button"
              role="tab"
              id={`how-tab-${journey.key}`}
              aria-selected={selected}
              aria-controls={`how-panel-${journey.key}`}
              onClick={() => setActive(journey.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all sm:px-5",
                selected ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <journey.icon className={cn("size-4", selected && (journey.key === "get" ? "text-primary" : "text-brand-yellow-700"))} />
              <span className="sm:hidden">{journey.short}</span>
              <span className="hidden sm:inline">{journey.tab}</span>
            </button>
          );
        })}
      </div>

      {JOURNEYS.map((journey) => {
        const blue = journey.key === "get";
        return (
          <div
            key={journey.key}
            role="tabpanel"
            id={`how-panel-${journey.key}`}
            aria-labelledby={`how-tab-${journey.key}`}
            hidden={active !== journey.key}
            className="animate-fade-up"
          >
            <ol className="relative mx-auto mt-10 grid max-w-4xl gap-8 sm:mt-12 sm:grid-cols-3 sm:gap-6">
              {/* Dashed path joining the three steps (desktop). */}
              <span aria-hidden="true" className={cn("absolute left-[16.66%] right-[16.66%] top-10 hidden border-t-2 border-dashed sm:block", blue ? "border-primary-200" : "border-brand-yellow-300")} />
              {journey.steps.map((step, index) => (
                <li key={step.title} className="relative flex items-start gap-4 text-left sm:flex-col sm:items-center sm:gap-0 sm:text-center">
                  <span className={cn("relative flex size-16 shrink-0 items-center justify-center rounded-full ring-8 ring-card sm:size-20", blue ? "bg-primary-50 text-primary" : "bg-brand-yellow-100 text-brand-yellow-800")}>
                    <step.icon className="size-7 sm:size-8" strokeWidth={1.75} />
                    <span className={cn("absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full text-xs font-extrabold shadow-soft", blue ? "bg-primary text-primary-foreground" : "bg-highlight text-highlight-foreground")}>
                      {index + 1}
                    </span>
                  </span>
                  <span className="min-w-0 pt-2 sm:mt-5 sm:pt-0">
                    <span className="block text-lg font-bold">{step.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground sm:mx-auto sm:max-w-[220px]">{step.text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12">
              <Link
                href={journey.cta.href}
                className={cn(
                  "group inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition-colors",
                  blue ? "bg-primary text-primary-foreground hover:bg-primary-700" : "bg-highlight text-highlight-foreground hover:bg-brand-yellow-400",
                )}
              >
                {journey.cta.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" /> ₦0 item · ₦0 delivery · you never meet strangers
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
