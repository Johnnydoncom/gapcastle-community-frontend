import { cn } from "@/lib/utils";

/**
 * The "GRATIS CASTLE" wordmark that sits beside the GC logo mark, typeset to match
 * the official lockup (public/brand/logo-lockup-768x553.png): heavy condensed
 * capitals in the mark's royal blue, with the italic serif tagline
 * "give freely, receive gratefully" beneath. The tagline is optically sized to the
 * width of the name so the two lines read as one block.
 */
export function BrandWordmark({
  inverted = false,
  tagline = "give freely, receive gratefully",
  className,
}: {
  inverted?: boolean;
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex select-none flex-col items-stretch", className)} aria-hidden="true">
      <span
        className={cn(
          "font-wordmark whitespace-nowrap text-[24px] uppercase leading-[0.9] tracking-[0.04em]",
          inverted ? "text-white" : "text-brand-royal",
        )}
      >
        Gratis Castle
      </span>
      <span
        className={cn(
          "font-tagline mt-[3px] whitespace-nowrap text-center text-[10px] italic leading-none",
          inverted ? "text-brand-yellow-300" : "text-foreground/70",
        )}
      >
        {tagline}
      </span>
    </span>
  );
}
