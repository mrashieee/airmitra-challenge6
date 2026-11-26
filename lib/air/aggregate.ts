import type { AirSample, NearbyStation, Target } from "./types";
import { computeAqi, bandFor, type PollutantKey } from "./naqi";
import { distanceKm } from "./geo";
import {
  buildSample,
  type OpenAQLatest,
  type OpenAQLocation,
} from "./providers/openaq";

const BASE = "https://api.openaq.org/v3";

export type CityStation = {
  name: string;
  distanceKm: number;
  aqi: number;
  bandLabel: string;
  updatedAt: string;
  sample: AirSample;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Official stations that represent the same city (within 15 km), with a
 * reading from the last 6 hours. Used to build a city median instead of
 * letting one station stand in for the whole city.
 */
export async function fetchCityStations(
  place: Target,
  radiusKm = 15,
): Promise<CityStation[]> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return [];

  try {
    const url = new URL(`${BASE}/locations`);
    url.searchParams.set("coordinates", `${place.lat},${place.lon}`);
    url.searchParams.set("radius", String(Math.min(25_000, radiusKm * 1000)));
    url.searchParams.set("limit", "20");

    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { results?: OpenAQLocation[] };

    const nearby = (data.results ?? [])
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
          row !== null && row.distanceKm <= radiusKm,
      )
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Deduplicate feeds that expose the same station twice.
    const unique: typeof nearby = [];
    for (const row of nearby) {
      const duplicate = unique.some(
        (kept) =>
          kept.location.name === row.location.name &&
          Math.abs(kept.distanceKm - row.distanceKm) < 0.5,
      );
      if (!duplicate) unique.push(row);
    }

    const now = Date.now();
    const stations = await Promise.all(
      unique.slice(0, 5).map(async ({ location, distanceKm: distance }) => {
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

          const ageMs = now - new Date(sample.source.updatedAt).getTime();
          if (!Number.isFinite(ageMs) || ageMs > 6 * 60 * 60 * 1000) return null;

          return {
            name: location.name,
            distanceKm: Math.round(distance * 10) / 10,
            aqi: sample.aqi,
            bandLabel: sample.bandLabel,
            updatedAt: sample.source.updatedAt,
            sample,
          } satisfies CityStation;
        } catch {
          return null;
        }
      }),
    );

    return stations
      .filter((row): row is CityStation => row !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  } catch {
    return [];
  }
}

/** Median concentration per pollutant, then one AQI from those medians. */
export function mergeCityStations(
  stations: CityStation[],
  area: string,
): {
  sample: AirSample;
  range: { min: number; max: number };
  list: NearbyStation[];
} | null {
  if (stations.length < 2) return null;

  const byKey = new Map<PollutantKey, number[]>();
  for (const station of stations) {
    for (const pollutant of station.sample.pollutants) {
      const list = byKey.get(pollutant.key) ?? [];
      list.push(pollutant.value);
      byKey.set(pollutant.key, list);
    }
  }

  // Require at least two stations reporting PM before averaging.
  const pmKeys = [...byKey.keys()].filter(
    (key) => key === "pm25" || key === "pm10",
  );
  if (!pmKeys.length) return null;

  const pollutants = [...byKey.entries()].map(([key, values]) => {
    const reference = stations
      .flatMap((station) => station.sample.pollutants)
      .find((pollutant) => pollutant.key === key)!;
    return {
      key,
      label: reference.label,
      value: Math.round(median(values) * 10) / 10,
      unit: reference.unit,
    };
  });

  const result = computeAqi(pollutants);
  if (!result) return null;

  const band = bandFor(result.aqi);
  const nearest = stations[0];
  const range = {
    min: Math.min(...stations.map((station) => station.aqi)),
    max: Math.max(...stations.map((station) => station.aqi)),
  };

  return {
    sample: {
      area,
      aqi: result.aqi,
      band: band.key,
      bandLabel: band.label,
      dominant: result.dominant,
      basis: "PM2.5/PM10",
      pollutants,
      source: {
        type: "ground",
        station: `${stations.length} official stations · median`,
        distanceKm: nearest.distanceKm,
        updatedAt: nearest.updatedAt,
      },
    },
    range,
    list: stations.map((station) => ({
      name: station.name,
      distanceKm: station.distanceKm,
      aqi: station.aqi,
      bandLabel: station.bandLabel,
      updatedAt: station.updatedAt,
      ageMinutes: Math.max(
        0,
        Math.round(
          (Date.now() - new Date(station.updatedAt).getTime()) / 60_000,
        ),
      ),
    })),
  };
}
