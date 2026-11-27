import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AirMitra — Household Air Coach",
    short_name: "AirMitra",
    description:
      "What your family should do about the air today — for your people, your home, and your routine.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f2e9",
    theme_color: "#0c5b4c",
    categories: ["health", "weather", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
