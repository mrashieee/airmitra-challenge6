import type { MetadataRoute } from "next";
import { slugify } from "@/lib/slug";
import { ALL_STATES, citiesFor } from "@/lib/states";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://sonic-redwood-usesmgf-rashinova8055-8355.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const cities = ALL_STATES.flatMap((state) =>
    citiesFor(state.code).map((city) => ({
      url: `${BASE}/aqi/${slugify(state.name)}/${slugify(city.name)}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  );

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...cities,
  ];
}
