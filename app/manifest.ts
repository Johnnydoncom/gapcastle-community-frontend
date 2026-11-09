import type { MetadataRoute } from "next";

/** Web app manifest — makes Gap Castle installable as an app on phones and desktops. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Gap Castle Community",
    short_name: "Gap Castle",
    description: "Free items shared by people across Nigeria. Give what you don't need, find what you do.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f4f6fb",
    theme_color: "#144a96",
    lang: "en-NG",
    dir: "ltr",
    categories: ["lifestyle", "shopping", "social"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Explore free items", short_name: "Explore", url: "/explore?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Give an item", short_name: "Give", url: "/give?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My requests", short_name: "Requests", url: "/account/requests?source=pwa", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
