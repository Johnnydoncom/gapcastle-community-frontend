import { Check } from "lucide-react";
import type { TimelineStep } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Order progress, from "Order confirmed" to "Received". Horizontal on wide
 * screens, vertical on phones.
 */
export function OrderTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  if (!steps.length) return null;

  return (
    <ol className={cn("grid gap-0 sm:grid-flow-col sm:auto-cols-fr", className)} aria-label="Order progress">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-4 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center" aria-current={step.current ? "step" : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 sm:left-[calc(50%+16px)] sm:top-[13px] sm:h-0.5 sm:w-[calc(100%-32px)]",
                  step.done ? "bg-success" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-extrabold",
                step.done ? "border-success bg-success text-white" : step.current ? "border-primary bg-primary-50 text-primary" : "border-border bg-card text-muted-foreground",
              )}
            >
              {step.done ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
            </span>
            <span className={cn("pt-0.5 text-xs leading-snug sm:px-1 sm:pt-0", step.done || step.current ? "font-semibold text-foreground" : "text-muted-foreground")}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
