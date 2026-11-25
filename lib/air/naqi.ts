export type BandKey =
  | "good"
  | "satisfactory"
  | "moderate"
  | "poor"
  | "veryPoor"
  | "severe";

export type Band = {
  key: BandKey;
  label: string;
  min: number;
  max: number;
};

export const BANDS: Band[] = [
  { key: "good", label: "Good", min: 0, max: 50 },
  { key: "satisfactory", label: "Satisfactory", min: 51, max: 100 },
  { key: "moderate", label: "Moderate", min: 101, max: 200 },
  { key: "poor", label: "Poor", min: 201, max: 300 },
  { key: "veryPoor", label: "Very Poor", min: 301, max: 400 },
  { key: "severe", label: "Severe", min: 401, max: 500 },
];

export function bandFor(aqi: number): Band {
  return BANDS.find((b) => aqi >= b.min && aqi <= b.max) ?? BANDS[0];
}

export type PollutantKey =
  | "pm25"
  | "pm10"
  | "no2"
  | "so2"
  | "o3"
  | "co"
  | "nh3";

export const POLLUTANT_LABELS: Record<PollutantKey, string> = {
  pm25: "PM2.5",
  pm10: "PM10",
  no2: "NO₂",
  so2: "SO₂",
  o3: "O₃",
  co: "CO",
  nh3: "NH₃",
};

export const POLLUTANT_UNITS: Record<PollutantKey, string> = {
  pm25: "µg/m³",
  pm10: "µg/m³",
  no2: "µg/m³",
  so2: "µg/m³",
  o3: "µg/m³",
  co: "mg/m³",
  nh3: "µg/m³",
};

/**
 * CPCB National AQI breakpoints.
 * Concentration ranges are the official CPCB ranges; AQI ranges follow 0-500.
 * Reference: CPCB NAQI booklet (2014).
 */
type Breakpoint = { c: [number, number]; i: [number, number] };

const BREAKPOINTS: Record<PollutantKey, Breakpoint[]> = {
  pm25: [
    { c: [0, 30], i: [0, 50] },
    { c: [31, 60], i: [51, 100] },
    { c: [61, 90], i: [101, 200] },
    { c: [91, 120], i: [201, 300] },
    { c: [121, 250], i: [301, 400] },
    { c: [251, 500], i: [401, 500] },
  ],
  pm10: [
    { c: [0, 50], i: [0, 50] },
    { c: [51, 100], i: [51, 100] },
    { c: [101, 250], i: [101, 200] },
    { c: [251, 350], i: [201, 300] },
    { c: [351, 430], i: [301, 400] },
    { c: [431, 600], i: [401, 500] },
  ],
  no2: [
    { c: [0, 40], i: [0, 50] },
    { c: [41, 80], i: [51, 100] },
    { c: [81, 180], i: [101, 200] },
    { c: [181, 280], i: [201, 300] },
    { c: [281, 400], i: [301, 400] },
    { c: [401, 600], i: [401, 500] },
  ],
  so2: [
    { c: [0, 40], i: [0, 50] },
    { c: [41, 80], i: [51, 100] },
    { c: [81, 380], i: [101, 200] },
    { c: [381, 800], i: [201, 300] },
    { c: [801, 1600], i: [301, 400] },
    { c: [1601, 2000], i: [401, 500] },
  ],
  o3: [
    { c: [0, 50], i: [0, 50] },
    { c: [51, 100], i: [51, 100] },
    { c: [101, 168], i: [101, 200] },
    { c: [169, 208], i: [201, 300] },
    { c: [209, 748], i: [301, 400] },
    { c: [749, 1000], i: [401, 500] },
  ],
  co: [
    { c: [0, 1], i: [0, 50] },
    { c: [1.1, 2], i: [51, 100] },
    { c: [2.1, 10], i: [101, 200] },
    { c: [10.1, 17], i: [201, 300] },
    { c: [17.1, 34], i: [301, 400] },
    { c: [34.1, 50], i: [401, 500] },
  ],
  nh3: [
    { c: [0, 200], i: [0, 50] },
    { c: [201, 400], i: [51, 100] },
    { c: [401, 800], i: [101, 200] },
    { c: [801, 1200], i: [201, 300] },
    { c: [1201, 1800], i: [301, 400] },
    { c: [1801, 2400], i: [401, 500] },
  ],
};

export function subIndex(key: PollutantKey, value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const table = BREAKPOINTS[key];
  for (const bp of table) {
    if (value <= bp.c[1]) {
      const span = bp.c[1] - bp.c[0];
      const ratio = span === 0 ? 0 : (value - bp.c[0]) / span;
      return Math.round(bp.i[0] + ratio * (bp.i[1] - bp.i[0]));
    }
  }
  return 500;
}

export type PollutantValue = {
  key: PollutantKey;
  label: string;
  value: number;
  unit: string;
};

export function computeAqi(pollutants: PollutantValue[]): {
  aqi: number;
  dominant: string;
} | null {
  let best: { aqi: number; dominant: string } | null = null;

  for (const p of pollutants) {
    const sub = subIndex(p.key, p.value);
    if (sub === null) continue;
    if (!best || sub > best.aqi) {
      best = { aqi: sub, dominant: p.label };
    }
  }

  return best;
}
