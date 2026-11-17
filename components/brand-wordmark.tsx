import { cn } from "@/lib/utils";

/**
 * Typeset "Gratis Castle / ALWAYS FREE" lockup that sits beside the logo mark.
 * The tagline is letter-justified so it spans exactly the width of the name,
 * giving a tidy, optically aligned block instead of two ragged lines.
 */
export function BrandWordmark({
  inverted = false,
  tagline = "Always free",
  className,
}: {
  inverted?: boolean;
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-col select-none", className)} aria-hidden="true">
      <span
        className={cn(
          "font-display text-[17px] font-bold leading-none tracking-[-0.025em] whitespace-nowrap",
          inverted ? "text-white" : "text-primary-800",
        )}
      >
        Gratis Castle
      </span>
      <span
        className={cn(
          "mt-[5px] flex justify-between text-[8.5px] font-semibold uppercase leading-none",
          inverted ? "text-brand-yellow-300" : "text-primary-500",
        )}
      >
        {tagline.split("").map((ch, i) => (
          <span key={i}>{ch === " " ? " " : ch}</span>
        ))}
      </span>
    </span>
  );
}
