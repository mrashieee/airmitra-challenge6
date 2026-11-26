import { ALL_STATES } from "./states";
import { stateCodeFor } from "./geocode";
import type { CitySuggestion } from "./search-types";

type OpenMeteoResult = {
  id: number;
  name: string;
  admin1?: string;
  country_code: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
};

type PhotonFeature = {
  properties: {
    osm_id?: number;
    name?: string;
    state?: string;
    city?: string;
    district?: string;
    county?: string;
    countrycode?: string;
    osm_key?: string;
    osm_value?: string;
  };
  geometry: { coordinates: [number, number] };
};

const SETTLEMENT_CODES = new Set([
  "PPL",
  "PPLA",
  "PPLA2",
  "PPLA3",
  "PPLA4",
  "PPLC",
  "PPLX",
  "PPLL",
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "neighbourhood",
  "locality",
  "administrative",
  "municipality",
  "borough",
]);

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % 1_000_000_007;
  }
  return h;
}

function isSettlement(result: CitySuggestion): boolean {
  const code = result.feature_code;
  return Boolean(code && SETTLEMENT_CODES.has(code));
}

async function fromOpenMeteo(query: string): Promise<CitySuggestion[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "20");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: OpenMeteoResult[] };
    return (data.results ?? [])
      .filter((result) => result.country_code === "IN")
      .map((result) => ({
        id: result.id,
        name: result.name,
        admin1: result.admin1,
        latitude: result.latitude,
        longitude: result.longitude,
        feature_code: result.feature_code,
      }));
  } catch {
    return [];
  }
}

async function fromPhoton(query: string): Promise<CitySuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AirMitra/0.1 (hackathon)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };

    return (data.features ?? [])
      .filter(
        (feature) =>
          feature.properties.countrycode === "IN" &&
          Boolean(feature.properties.name) &&
          Array.isArray(feature.geometry?.coordinates),
      )
      .map((feature) => {
        const name = feature.properties.name as string;
        const [longitude, latitude] = feature.geometry.coordinates;
        const admin1 =
          feature.properties.state ??
          feature.properties.city ??
          feature.properties.district ??
          feature.properties.county;

        return {
          id:
            feature.properties.osm_id ??
            hash(`${name}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`),
          name,
          admin1,
          latitude,
          longitude,
          feature_code: feature.properties.osm_value,
        };
      });
  } catch {
    return [];
  }
}

export async function geocodeCities(
  query: string,
  stateCode: string | null,
  limit = 8,
): Promise<CitySuggestion[]> {
  if (query.trim().length < 2) return [];

  const [openMeteo, photon] = await Promise.all([
    fromOpenMeteo(query),
    fromPhoton(query),
  ]);

  const seen = new Set<string>();
  const settlements: CitySuggestion[] = [];
  const others: CitySuggestion[] = [];

  for (const result of [...openMeteo, ...photon]) {
    if (stateCode && stateCodeFor(result) !== stateCode) continue;

    const key = `${result.name.toLowerCase()}|${(result.admin1 ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const settlement = isSettlement(result);
    const row = { ...result, approximate: true as const };
    if (settlement) settlements.push(row);
    else others.push(row);
  }

  if (!settlements.length && others.length) {
    settlements.push({
      id: hash(query.toLowerCase()),
      name: query,
      admin1: others[0].admin1,
      latitude: others[0].latitude,
      longitude: others[0].longitude,
      approximate: true,
    });
  }

  return settlements.slice(0, limit);
}

export function knownState(code: string): boolean {
  return ALL_STATES.some((state) => state.code === code);
}
