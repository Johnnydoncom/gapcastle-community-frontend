import { Suspense } from "react";
import { CategoryNav, CategoryNavSkeleton } from "@/components/site/category-nav";
import { FooterHubNote } from "@/components/site/footer-hub-note";
import { SiteChrome } from "@/components/site-chrome";

/** The public marketplace: header, category strip, footer and the mobile tab bar. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteChrome
      categoryNav={
        <Suspense fallback={<CategoryNavSkeleton />}>
          <CategoryNav />
        </Suspense>
      }
      hubNote={
        <Suspense fallback="Collect from a Gratis Castle pickup hub.">
          <FooterHubNote />
        </Suspense>
      }
    >
      {children}
    </SiteChrome>
  );
}
