import { Suspense } from "react";
import { CategoryNav, CategoryNavSkeleton } from "@/components/site/category-nav";
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
    >
      {children}
    </SiteChrome>
  );
}
