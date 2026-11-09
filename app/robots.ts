import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/admin", "/api", "/auth", "/reset-password", "/verified", "/verify-email"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
