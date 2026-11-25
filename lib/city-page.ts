import { stateCodeFor } from "./geocode";
import { ALL_STATES, citiesFor, type CityEntry } from "./states";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const STATE_ALIASES: Record<string, string> = {
  delhi: "DL",
  "nct-of-delhi": "DL",
  "delhi-ncr": "DL",
  pondicherry: "PY",
  orissa: "OD",
  uttaranchal: "UK",
  "jammu-and-kashmir": "JK",
};

export function stateBySlug(slug: string) {
  const exact = ALL_STATES.find((state) => slugify(state.name) === slug);
  if (exact) return exact;

  const short = ALL_STATES.find(
    (state) => slugify(state.name.replace(/\s*\(.*?\)\s*/g, "")) === slug,
  );
  if (short) return short;

  const code = STATE_ALIASES[slug];
  return code ? (ALL_STATES.find((state) => state.code === code) ?? null) : null;
}

export function citiesForStatePage(stateCode: string): CityEntry[] {
  return citiesFor(stateCode).slice(0, 12);
}

type OpenMeteoResult = {
  name: string;
  admin1?: string;
  country_code: string;
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  properties: {
    name?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    countrycode?: string;
  };
  geometry: { coordinates: [number, number] };
};

async function fromOpenMeteo(
  query: string,
  stateCode: string,
): Promise<CityEntry | null> {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "20");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = (await res.json()) as { results?: OpenMeteoResult[] };
    const match = (data.results ?? []).find(
      (result) =>
        result.country_code === "IN" &&
        stateCodeFor({
          admin1: result.admin1,
          latitude: result.latitude,
          longitude: result.longitude,
        }) === stateCode,
    );

    return match
      ? {
          name: match.name,
          lat: match.latitude,
          lon: match.longitude,
        }
      : null;
  } catch {
    return null;
  }
}

async function fromPhoton(
  query: string,
  stateCode: string,
): Promise<CityEntry | null> {
  try {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "20");
    url.searchParams.set("lang", "en");

    const res = await fetch(url, {
      headers: { "User-Agent": "AirMitra/0.1 (hackathon)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { features?: PhotonFeature[] };

    for (const feature of data.features ?? []) {
      if (feature.properties.countrycode !== "IN") continue;
      const name =
        feature.properties.city ??
        feature.properties.district ??
        feature.properties.name ??
        feature.properties.county;
      const [lon, lat] = feature.geometry.coordinates;
      if (!name || typeof lat !== "number" || typeof lon !== "number") continue;

      const code = stateCodeFor({
        admin1: feature.properties.state,
        latitude: lat,
        longitude: lon,
      });

      if (code === stateCode) return { name, lat, lon };
    }

    return null;
  } catch {
    return null;
  }
}

export async function cityBySlug(
  stateCode: string,
  citySlug: string,
): Promise<CityEntry | null> {
  const curated = citiesFor(stateCode).find(
    (city) => slugify(city.name) === citySlug,
  );
  if (curated) return curated;

  const query = citySlug.replace(/-/g, " ");
  return (
    (await fromOpenMeteo(query, stateCode)) ??
    (await fromPhoton(query, stateCode))
  );
}
