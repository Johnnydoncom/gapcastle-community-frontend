import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** Hosts that serve listing photos, avatars and category images to next/image. */
function imageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: Array<{ protocol: "http" | "https"; hostname: string; port?: string }> = [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "community-api.gapcastle.com" },
    { protocol: "http", hostname: "localhost" },
    { protocol: "http", hostname: "127.0.0.1" },
  ];

  try {
    const backend = new URL(process.env.BACKEND_URL ?? "");
    patterns.push({ protocol: backend.protocol === "https:" ? "https" : "http", hostname: backend.hostname });
  } catch {
    // BACKEND_URL unset or invalid — the defaults above still apply.
  }

  return patterns;
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: imageRemotePatterns(),
    // The local Laravel API serves photos from localhost; Next blocks private IPs by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
