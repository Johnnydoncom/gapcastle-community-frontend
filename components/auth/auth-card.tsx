import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import logoMark from "@/public/brand/logo-mark.png";

/**
 * Shared shell for the sign-in, join and password screens (server component, so the heading
 * and copy are in the server HTML). Based on the card in gapcastle-lovable/src/routes/auth.tsx.
 *
 * Phones: no card chrome, content starts near the top so the on-screen keyboard never hides
 * the form. Tablets and up: the centred Lovable card.
 */
export function AuthCard({
  title,
  description,
  wide = false,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  wide?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[calc(100dvh-7.5rem)] justify-center pb-10 pt-6 sm:min-h-[calc(100dvh-4rem)] sm:items-center sm:py-10">
      <div
        className={cn(
          "w-full sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-8 sm:shadow-soft",
          wide ? "max-w-xl" : "max-w-md",
        )}
      >
        <div className="mb-6 text-center">
          <Image src={logoMark} alt="Gratis Castle" className="mx-auto mb-3 h-10 w-auto sm:h-12" sizes="64px" priority />
          <h1 className="text-[1.625rem] font-bold leading-tight sm:text-2xl">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        {footer && <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
