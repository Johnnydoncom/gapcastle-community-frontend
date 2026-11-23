import { cn } from "@/lib/utils";

/**
 * Renders sanitised rich text from the API (category descriptions, announcements,
 * page content). The backend keeps only allowlisted formatting (App\Support\RichText),
 * so the HTML is safe to render. Server-safe: no client JavaScript.
 */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
