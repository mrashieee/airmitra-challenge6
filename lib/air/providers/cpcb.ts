import type { StateEntry } from "@/lib/states";
import { distanceKm } from "../geo";
import type { Target } from "../types";
import {
  bandFor,
  computeAqi,
  POLLUTANT_LABELS,
  POLLUTANT_UNITS,
  type PollutantKey,
  type PollutantValue,
} from "../naqi";
import type { AirSample } from "../types";

const RESOURCE =
  "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

type CpcbRecord = {
  station: string;
  city: string;
  state: string;
  last_update: string;
  latitude: string;
  longitude: string;
  pollutant_id: string;
  min_value: string;
  max_value: string;
  avg_value: string;
};

type CpcbResponse = {
  status?: string;
  total?: number;
  records?: CpcbRecord[];
};

type CpcbQuery = { records: CpcbRecord[]; failed: boolean };

export type CpcbResult = {
  sample: AirSample | null;
  failed: boolean;
  nearestKm?: number;
  tooFar?: boolean;
};

/** A station farther than this is less local than the CAMS grid. */
const MAX_STATION_KM = 30;

const POLLUTANT_MAP: Record<string, PollutantKey> = {
  "PM2.5": "pm25",
  PM10: "pm10",
  NO2: "no2",
  SO2: "so2",
  OZONE: "o3",
  CO: "co",
  NH3: "nh3",
};

// Serialize CPCB calls per instance. Bursts get rate-limited; one at a time
// is slower but far more reliable.
let queue: Promise<unknown> = Promise.resolve();

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function stateCandidates(state: StateEntry): string[] {
  const base = state.name.replace(/\s*\(.*\)$/, "");
  const set = new Set<string>([base, base.replace(/ and /g, " & ")]);

  if (base.startsWith("Dadra")) {
    set.add("Daman & Diu");
    set.add("Dadra & Nagar Haveli");
    set.add("Daman");
  }
  if (base.startsWith("Andaman")) set.add("Andaman & Nicobar Islands");
  if (base.startsWith("Jammu")) set.add("Jammu & Kashmir");

  return [...set];
}

async function query(
  key: string,
  filterKey: "filters[state]" | "filters[city]",
  filterValue: string,
): Promise<CpcbQuery> {
  const url = new URL(RESOURCE);
  url.searchParams.set("api-key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1000");
  url.searchParams.set(filterKey, filterValue);

  try {
    const res = await serial(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      try {
        return await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    });

    if (!res.ok) return { records: [], failed: true };

    const json = (await res.json()) as CpcbResponse;
    if (json.status !== "ok") return { records: [], failed: true };

    return { records: json.records ?? [], failed: false };
  } catch {
    return { records: [], failed: true };
  }
}

function parseCpcbDate(value: string): string {
  const match = value.match(
    /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) return new Date().toISOString();
  const [, dd, mm, yyyy, hh, min, ss] = match;
  // CPCB timestamps are IST.
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`).toISOString();
}

export async function fetchCpcb(
  state: StateEntry,
  apiKey: string | undefined,
  target?: Target,
): Promise<CpcbResult> {
  if (!apiKey) return { sample: null, failed: true };

  const place = target ?? {
    lat: state.lat,
    lon: state.lon,
    city: state.capital,
  };

  let records: CpcbRecord[] = [];
  let failed = false;

  for (const candidate of stateCandidates(state)) {
    const result = await query(apiKey, "filters[state]", candidate);
    failed = failed || result.failed;
    records = result.records;
    if (records.length) break;
  }

  if (!records.length) {
    const result = await query(apiKey, "filters[city]", state.capital);
    failed = failed || result.failed;
    records = result.records;
  }

  if (!records.length) return { sample: null, failed };

  const byStation = new Map<string, CpcbRecord[]>();
  for (const record of records) {
    const list = byStation.get(record.station) ?? [];
    list.push(record);
    byStation.set(record.station, list);
  }

  let best:
    | { station: string; records: CpcbRecord[]; distance: number }
    | null = null;

  for (const [station, stationRecords] of byStation) {
    const lat = Number(stationRecords[0].latitude);
    const lon = Number(stationRecords[0].longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const distance = distanceKm(
      { lat: place.lat, lon: place.lon },
      { lat, lon },
    );

    if (!best || distance < best.distance) {
      best = { station, records: stationRecords, distance };
    }
  }

  if (!best) return { sample: null, failed };

  if (best.distance > MAX_STATION_KM) {
    return {
      sample: null,
      failed: false,
      nearestKm: Math.round(best.distance * 10) / 10,
      tooFar: true,
    };
  }

  const seen = new Map<PollutantKey, PollutantValue>();
  for (const record of best.records) {
    const key = POLLUTANT_MAP[record.pollutant_id?.toUpperCase()];
    if (!key) continue;

    let value = Number(record.avg_value);
    if (!Number.isFinite(value)) continue;

    // Guard against µg/m³ rows in an otherwise mg/m³ CO field.
    if (key === "co" && value > 50) value = value / 1000;

    seen.set(key, {
      key,
      label: POLLUTANT_LABELS[key],
      value,
      unit: POLLUTANT_UNITS[key],
    });
  }

  const pollutants = [...seen.values()];
  const pm = pollutants.filter((p) => p.key === "pm25" || p.key === "pm10");
  const result = computeAqi(pm.length ? pm : pollutants);
  if (!result) return { sample: null, failed };

  const band = bandFor(result.aqi);
  const area = target?.city ?? best.station.split(",")[0]?.trim() ?? state.capital;

  return {
    sample: {
      area,
      aqi: result.aqi,
      band: band.key,
      bandLabel: band.label,
      dominant: result.dominant,
      basis: pm.length ? "PM2.5/PM10" : "mixed",
      pollutants,
      source: {
        type: "ground",
        station: `${best.station} · CPCB`,
        distanceKm: Math.round(best.distance * 10) / 10,
        updatedAt: parseCpcbDate(best.records[0].last_update),
      },
    },
    failed: false,
  };
}
