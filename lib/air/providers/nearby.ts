import { distanceKm } from "../geo";
import type { AirSample, Target, NearbyStation } from "../types";
import {
  buildSample,
  type OpenAQLatest,
  type OpenAQLocation,
} from "./openaq";

const BASE = "https://api.openaq.org/v3";

export type NearbySampleRow = {
  name: string;
  distanceKm: number;
  ageMinutes: number;
  sample: AirSample;
};

/**
 * Finds live ground monitors around a place that has no station of its own.
 * OpenAQ caps `radius` at 25 km, so we use a bounding box (~100 km) instead.
 * Only stations reporting PM within the last 12 hours are returned.
 */
export async function fetchNearbySamples(
  place: Target,
  limit = 4,
  maxKm = 100,
): Promise<NearbySampleRow[]> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return [];

  const dLat = 0.9;
  const dLon = 0.9 / Math.max(0.2, Math.cos((place.lat * Math.PI) / 180));

  const bbox = [
    (place.lon - dLon).toFixed(3),
    (place.lat - dLat).toFixed(3),
    (place.lon + dLon).toFixed(3),
    (place.lat + dLat).toFixed(3),
  ].join(",");

  try {
    const url = new URL(`${BASE}/locations`);
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("limit", "100");

    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: OpenAQLocation[] };
    const candidates = (data.results ?? [])
      .filter(
        (loc) =>
          loc.country?.code === "IN" &&
          Array.isArray(loc.sensors) &&
          loc.sensors.length > 0,
      )
      .map((location) => {
        const lat = location.coordinates?.latitude;
        const lon = location.coordinates?.longitude;
        if (typeof lat !== "number" || typeof lon !== "number") return null;
        return {
          location,
          distanceKm: distanceKm(
            { lat: place.lat, lon: place.lon },
            { lat, lon },
          ),
        };
      })
      .filter(
        (row): row is { location: OpenAQLocation; distanceKm: number } =>
          row !== null && row.distanceKm <= maxKm,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, Math.max(limit, 4));

    const now = Date.now();
    const results = await Promise.all(
      candidates.map(async ({ location, distanceKm: distance }) => {
        try {
          const latestRes = await fetch(
            `${BASE}/locations/${location.id}/latest`,
            {
              headers: { "X-API-Key": key },
              signal: AbortSignal.timeout(6000),
            },
          );
          if (!latestRes.ok) return null;

          const latest = (await latestRes.json()) as {
            results?: OpenAQLatest[];
          };
          const sample = buildSample(
            location,
            latest.results ?? [],
            place.city,
            distance,
          );
          if (!sample || sample.basis !== "PM2.5/PM10") return null;

          const ageMinutes = Math.round(
            (now - new Date(sample.source.updatedAt).getTime()) / 60_000,
          );
          if (!Number.isFinite(ageMinutes) || ageMinutes > 12 * 60) return null;

          return {
            name: location.name,
            distanceKm: Math.round(distance * 10) / 10,
            ageMinutes: Math.max(0, ageMinutes),
            sample,
          } satisfies NearbySampleRow;
        } catch {
          return null;
        }
      }),
    );

    return results
      .filter((row): row is NearbySampleRow => row !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchNearbyStations(
  place: Target,
  limit = 3,
): Promise<NearbyStation[]> {
  const rows = await fetchNearbySamples(place, Math.max(limit, 4));
  return rows.slice(0, limit).map((row) => ({
    name: row.name,
    distanceKm: row.distanceKm,
    aqi: row.sample.aqi,
    bandLabel: row.sample.bandLabel,
    updatedAt: row.sample.source.updatedAt,
    ageMinutes: row.ageMinutes,
  }));
}
