import Link from "next/link";
import { RichHtml } from "@/components/rich-html";
import { Button } from "@/components/ui/button";
import { CONTENT_PAGES, type ContentSlug } from "@/lib/content";
import { getSeoPageData } from "@/lib/server/seo-api";

/**
 * Information pages in the Lovable card style. Admins can replace the heading, intro
 * and body from Admin › Pages & SEO; otherwise the built-in text is shown.
 */
export async function ContentPage({ slug, children }: { slug: ContentSlug; children?: React.ReactNode }) {
  const page = CONTENT_PAGES[slug];
  const custom = await getSeoPageData(slug);
  return (
    <div className="container-page max-w-3xl py-10">
      <p className="text-sm font-semibold text-primary">{page.eyebrow}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{custom?.content_heading || page.title}</h1>
      <p className="mt-3 text-lg text-muted-foreground">{custom?.content_intro || page.intro}</p>
      {custom?.content_body ? (
        <article className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <RichHtml html={custom.content_body} className="leading-relaxed text-muted-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground" />
        </article>
      ) : (
      <div className="mt-8 space-y-4">
        {page.sections.map((section) => (
          <section key={section.heading} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-bold">{section.heading}</h2>
            {"body" in section && section.body && <p className="mt-2 leading-relaxed text-muted-foreground">{section.body}</p>}
            {"points" in section && section.points && (
              <ul className="mt-3 space-y-2 text-muted-foreground">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{point}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      )}
      {children}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-cream p-6">
        <p className="font-semibold">Ready to share or find something useful?</p>
        <div className="flex gap-2">
          <Button asChild><Link href="/explore">Explore items</Link></Button>
          <Button asChild variant="highlight"><Link href="/give">Give an item</Link></Button>
        </div>
      </div>
    </div>
  );
}
