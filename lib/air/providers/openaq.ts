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
  const sensorMap = new Map(
    (location.sensors ?? []).map((sensor) => [sensor.id, sensor]),
  );

  // OpenAQ can return older rows alongside today's reading for the same
  // sensor, so keep only the freshest row per sensor.
  const timeOf = (row: OpenAQLatest) =>
    Date.parse(row.datetime?.utc ?? "") || 0;

  const freshest = new Map<number, OpenAQLatest>();
  for (const row of latest) {
    const previous = freshest.get(row.sensorsId);
    if (!previous || timeOf(row) >= timeOf(previous)) {
      freshest.set(row.sensorsId, row);
    }
  }

  const pollutants: PollutantValue[] = [];
  let latestTime: string | undefined;

  for (const reading of freshest.values()) {
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

    const stamp = reading.datetime?.utc;
    if (stamp && (!latestTime || Date.parse(stamp) > Date.parse(latestTime))) {
      latestTime = stamp;
    }

    pollutants.push({
      key: keyName,
      label: POLLUTANT_LABELS[keyName],
      value,
      unit: POLLUTANT_UNITS[keyName],
    });
  }

  const pm = pollutants.filter((p) => p.key === "pm25" || p.key === "pm10");
  const result = computeAqi(pm.length ? pm : pollutants);
  if (!result) return null;

  const band = bandFor(result.aqi);

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
      updatedAt: latestTime ?? new Date().toISOString(),
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
    const url = new URL(`${BASE}/locations`);
    url.searchParams.set("coordinates", `${place.lat},${place.lon}`);
    url.searchParams.set("radius", "25000");
    url.searchParams.set("limit", "10");

    const res = await fetch(url, {
      headers: { "X-API-Key": key },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { sample: null, failed: true };

    const data = (await res.json()) as { results?: OpenAQLocation[] };
    const locations = (data.results ?? []).filter(
      (loc) =>
        loc.country?.code === "IN" &&
        Array.isArray(loc.sensors) &&
        loc.sensors.length > 0,
    );

    let best: { location: OpenAQLocation; distance: number } | null = null;
    for (const location of locations) {
      const lat = location.coordinates?.latitude;
      const lon = location.coordinates?.longitude;
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      const distance = distanceKm(
        { lat: place.lat, lon: place.lon },
        { lat, lon },
      );
      if (!best || distance < best.distance) best = { location, distance };
    }

    if (!best) return { sample: null, failed: false };

    const latestRes = await fetch(
      `${BASE}/locations/${best.location.id}/latest`,
      {
        headers: { "X-API-Key": key },
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!latestRes.ok) {
      return {
        sample: null,
        failed: true,
        nearestKm: Math.round(best.distance * 10) / 10,
      };
    }

    const latest = (await latestRes.json()) as { results?: OpenAQLatest[] };
    const sample = buildSample(
      best.location,
      latest.results ?? [],
      place.city,
      best.distance,
    );

    return {
      sample,
      failed: false,
      nearestKm: Math.round(best.distance * 10) / 10,
    };
  } catch {
    return { sample: null, failed: true };
  }
}
