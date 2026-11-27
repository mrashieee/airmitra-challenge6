import type { StateEntry } from "@/lib/states";
import { distanceKm } from "../geo";
import {
  bandFor,
  computeAqi,
  POLLUTANT_LABELS,
  POLLUTANT_UNITS,
  type PollutantKey,
  type PollutantValue,
} from "../naqi";
import type { AirSample, Target } from "../types";

const BASE = "https://api.openaq.org/v3";

export type OpenAQSensor = {
  id: number;
  parameter: { name: string; units: string };
};

export type OpenAQLocation = {
  id: number;
  name: string;
  country?: { code?: string };
  coordinates?: { latitude?: number; longitude?: number };
  sensors?: OpenAQSensor[];
};

export type OpenAQLatest = {
  sensorsId: number;
  value: number;
  datetime?: { utc?: string; local?: string };
};

export type OpenAQResult = {
  sample: AirSample | null;
  failed: boolean;
  nearestKm?: number;
};

const PARAM_MAP: Record<string, PollutantKey> = {
  pm25: "pm25",
  pm10: "pm10",
  no2: "no2",
  so2: "so2",
  o3: "o3",
  co: "co",
};

function normalise(
  key: PollutantKey,
  value: number,
  units: string,
): number | null {
  const unit = units.toLowerCase();

  if (key === "co") {
    if (unit.includes("ppm")) return (value * 1.145) / (unit.includes("ppb") ? 1000 : 1);
    if (unit.includes("ppb")) return (value * 1.145) / 1000;
    if (unit.includes("mg")) return value;
    return value / 1000;
  }

  if (unit.includes("µg") || unit.includes("ug") || unit.includes("micro")) {
    return value;
  }

  return null;
}

/** Turns an OpenAQ location + its latest readings into a normalised sample. */
export function buildSample(
  location: OpenAQLocation,
  latest: OpenAQLatest[],
  area: string,
  distanceKmValue: number,
): AirSample | null {
  const timeOf = (row: OpenAQLatest) => Date.parse(row.datetime?.utc ?? "") || 0;
  const newest = latest.reduce((max, row) => Math.max(max, timeOf(row)), 0);

  // OpenAQ returns old rows for retired sensor ids alongside today's reading.
  // Only keep rows close to the newest timestamp so a 2022 value can never
  // masquerade as "now".
  const FRESH_WINDOW_MS = 6 * 60 * 60 * 1000;
  const usable =
    newest > 0
      ? latest.filter((row) => timeOf(row) >= newest - FRESH_WINDOW_MS)
      : latest;

  const sensorMap = new Map(
    (location.sensors ?? []).map((sensor) => [sensor.id, sensor]),
  );

  // Multiple sensors can report the same pollutant. Keep the freshest one and
  // break ties with the higher value.
  const best = new Map<
    PollutantKey,
    { value: number; time: number; unit: string }
  >();

  for (const reading of usable) {
    const sensor = sensorMap.get(reading.sensorsId);
    if (!sensor) continue;
    const keyName = PARAM_MAP[sensor.parameter.name];
    if (!keyName) continue;
    if (typeof reading.value !== "number" || !Number.isFinite(reading.value)) {
      continue;
    }

    const value = normalise(
      keyName,
      reading.value,
      sensor.parameter.units ?? "",
    );
    if (value === null) continue;

    const time = timeOf(reading);
    const previous = best.get(keyName);
    if (!previous || time > previous.time || (time === previous.time && value > previous.value)) {
      best.set(keyName, { value, time, unit: POLLUTANT_UNITS[keyName] });
    }
  }

  const pollutants: PollutantValue[] = [...best.entries()].map(
    ([key, entry]) => ({
      key,
      label: POLLUTANT_LABELS[key],
      value: Math.round(entry.value * 10) / 10,
      unit: entry.unit,
    }),
  );

  const pm = pollutants.filter((p) => p.key === "pm25" || p.key === "pm10");
  const result = computeAqi(pm.length ? pm : pollutants);
  if (!result) return null;

  const band = bandFor(result.aqi);
  const latestTime =
    newest > 0 ? new Date(newest).toISOString() : new Date().toISOString();

  return {
    area,
    aqi: result.aqi,
    band: band.key,
    bandLabel: band.label,
    dominant: result.dominant,
    basis: pm.length ? "PM2.5/PM10" : "mixed",
    pollutants,
    source: {
      type: "ground",
      station: `${location.name} · OpenAQ`,
      distanceKm: Math.round(distanceKmValue * 10) / 10,
      updatedAt: latestTime,
    },
  };
}

export async function fetchOpenAQ(
  state: StateEntry,
  target?: Target,
): Promise<OpenAQResult> {
  const key = process.env.OPENAQ_API_KEY;
  if (!key) return { sample: null, failed: false };

  const place = target ?? {
    lat: state.lat,
    lon: state.lon,
    city: state.capital,
  };

  try {
    // OpenAQ caps radius at 25 km, but bbox lets us cover the same 30 km
    // cutoff used for CPCB. This matters for cities whose nearest monitor is
    // 25-30 km away.
    const dLat = 0.35;
    const dLon = 0.35 / Math.max(0.2, Math.cos((place.lat * Math.PI) / 180));
    const bbox = [
      (place.lon - dLon).toFixed(3),
      (place.lat - dLat).toFixed(3),
      (place.lon + dLon).toFixed(3),
      (place.lat + dLat).toFixed(3),
    ].join(",");

    const url = new URL(`${BASE}/locations`);
    url.searchParams.set("bbox", bbox);
    url.searchParams.set("limit", "50");

    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { sample: null, failed: true };

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
          distance: distanceKm(
            { lat: place.lat, lon: place.lon },
            { lat, lon },
          ),
        };
      })
      .filter(
        (row): row is { location: OpenAQLocation; distance: number } =>
          row !== null && row.distance <= 30,
      )
      .sort((a, b) => a.distance - b.distance);

    if (!candidates.length) return { sample: null, failed: false };

    let failed = false;

    // Try nearest first, but skip dead stations (e.g. Kochi's 2022 feeds).
    for (const candidate of candidates.slice(0, 5)) {
      try {
        const latestRes = await fetch(
          `${BASE}/locations/${candidate.location.id}/latest`,
          {
            headers: { "X-API-Key": key },
            signal: AbortSignal.timeout(6000),
          },
        );
        if (!latestRes.ok) {
          failed = true;
          continue;
        }

        const latest = (await latestRes.json()) as {
          results?: OpenAQLatest[];
        };
        const sample = buildSample(
          candidate.location,
          latest.results ?? [],
          place.city,
          candidate.distance,
        );
        if (!sample) continue;

        const ageMs =
          Date.now() - new Date(sample.source.updatedAt).getTime();
        if (!Number.isFinite(ageMs) || ageMs > 12 * 60 * 60 * 1000) {
          continue;
        }

        return {
          sample,
          failed: false,
          nearestKm: Math.round(candidate.distance * 10) / 10,
        };
      } catch {
        failed = true;
      }
    }

    return {
      sample: null,
      failed,
      nearestKm: Math.round(candidates[0].distance * 10) / 10,
    };
  } catch {
    return { sample: null, failed: true };
  }
}
