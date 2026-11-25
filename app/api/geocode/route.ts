import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import { stateCodeFor } from "@/lib/geocode";

type GeoResult = {
  id: number;
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
};

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

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h * 31 + value.charCodeAt(i)) % 1_000_000_007;
  }
  return h;
}

async function fromOpenMeteo(query: string): Promise<GeoResult[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "20");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: OpenMeteoResult[] };
    return (data.results ?? [])
      .filter((r) => r.country_code === "IN")
      .map((r) => ({
        id: r.id,
        name: r.name,
        admin1: r.admin1,
        latitude: r.latitude,
        longitude: r.longitude,
        feature_code: r.feature_code,
      }));
  } catch {
    return [];
  }
}

async function fromPhoton(query: string): Promise<GeoResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AirMitra/0.1 (hackathon)" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };

    return (data.features ?? [])
      .filter(
        (f) =>
          f.properties.countrycode === "IN" &&
          Boolean(f.properties.name) &&
          Array.isArray(f.geometry?.coordinates),
      )
      .map((f) => {
        const name = f.properties.name as string;
        const [longitude, latitude] = f.geometry.coordinates;
        const admin1 =
          f.properties.state ??
          f.properties.city ??
          f.properties.district ??
          f.properties.county;

        return {
          id:
            f.properties.osm_id ??
            hash(`${name}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`),
          name,
          admin1,
          latitude,
          longitude,
          feature_code: f.properties.osm_value,
        };
      });
  } catch {
    return [];
  }
}

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

function isSettlement(result: GeoResult): boolean {
  return Boolean(result.feature_code && SETTLEMENT_CODES.has(result.feature_code));
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return Response.json({ results: [] });

  const requestedState = (
    request.nextUrl.searchParams.get("state") ?? ""
  ).toUpperCase();
  const stateCode = ALL_STATES.some((s) => s.code === requestedState)
    ? requestedState
    : null;

  const [openMeteo, photon] = await Promise.all([
    fromOpenMeteo(query),
    fromPhoton(query),
  ]);

  const seen = new Set<string>();
  const settlements: GeoResult[] = [];
  const others: GeoResult[] = [];

  for (const result of [...openMeteo, ...photon]) {
    if (stateCode && stateCodeFor(result) !== stateCode) continue;

    const key = `${result.name.toLowerCase()}|${(result.admin1 ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (isSettlement(result)) settlements.push(result);
    else others.push(result);
  }

  if (!settlements.length && others.length) {
    // No settlement found. Let the user pick the query name at the nearest
    // matching coordinate (road, landmark, etc.) instead of a dead end.
    settlements.push({
      id: hash(query.toLowerCase()),
      name: query,
      admin1: others[0].admin1,
      latitude: others[0].latitude,
      longitude: others[0].longitude,
      feature_code: "approximate",
    });
  }

  return Response.json(
    { results: settlements.slice(0, 12) },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
