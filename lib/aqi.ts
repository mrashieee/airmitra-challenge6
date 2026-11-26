import { BANDS, bandFor, comfortWindows } from "@/lib/air/naqi";
import type { Band, BandKey } from "@/lib/air/naqi";
import type { AirReading, NearbyStation } from "@/lib/air/types";
import type { FamilyMember, Profile } from "./profile";
import type { StateEntry } from "./states";

export { BANDS, bandFor };
export type { Band, BandKey };

export type Reading = {
  state: StateEntry;
  area: string;
  aqi: number;
  band: Band;
  dominant: string;
  basis?: string;
  pollutants: { label: string; value: number; unit: string }[];
  weather: AirReading["weather"];
  source: {
    type: "ground" | "model";
    station: string;
    distanceKm: number;
    updated: string;
  };
  cached?: boolean;
  stale?: boolean;
  degraded?: boolean;
  fallbackReason?: string;
  nearestStationKm?: number;
  usAqi?: number;
  usAqiBasis?: string;
  nearby?: NearbyStation[];
  stations?: NearbyStation[];
  aqiRange?: { min: number; max: number };
  windows: { best: string; avoid: string };
  demo: boolean;
  guidelines: string[];
  family: { name: string; meta: string; advice: string; tone: "warn" | "calm" }[];
  mustGoOut: { name: string; advice: string }[];
  doNow: { title: string; body: string; impact: string }[];
  impact: { title: string; value: string; note: string };
};

const MODEL_ONLY = new Set(["AN", "LD", "LA", "MZ", "NL", "AR", "SK", "DN"]);
const MOCK_ISO = "2026-01-01T00:00:00.000Z";

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 100000;
  }
  return h;
}

function guidelinesFor(key: BandKey): string[] {
  if (key === "severe" || key === "veryPoor") {
    return [
      "Reduce outdoor activity until air improves. If you must go out: fitted N95, short trips, avoid main roads.",
      "Keep windows closed while outdoor air is worse than indoor.",
      "Sensitive groups: stay in if possible. If you must go out: N95 and under 15 minutes.",
    ];
  }
  if (key === "poor" || key === "moderate") {
    return [
      "Limit outdoor time. If you must go out: N95 for sensitive groups, short trips.",
      "Ventilate when wind picks up; keep windows closed during peak hours.",
      "Sensitive groups: skip outdoor exercise today.",
    ];
  }
  return [
    "Good window - open up and go out.",
    "Dry clothes outside and ventilate the house.",
    "No mask needed; sensitive groups keep one handy.",
  ];
}

function adviceForMember(
  member: FamilyMember,
  aqi: number,
  key: BandKey,
): { advice: string; tone: "warn" | "calm" } {
  const hasResp = member.conditions.some((c) =>
    ["Asthma", "COPD", "Heart"].includes(c),
  );
  const ageStart = Number.parseInt(member.ageBand, 10);
  const isSenior = Number.isFinite(ageStart) ? ageStart >= 60 : false;
  const isChild = Number.isFinite(ageStart)
    ? ageStart <= 12
    : member.ageBand === "0-5";
  const pregnant = member.conditions.includes("Pregnant");
  const severe = member.severity === "Severe";
  const moderateCondition = member.severity === "Moderate";

  const high = aqi > (severe ? 100 : 150);
  const veryHigh = aqi > (severe ? 200 : moderateCondition ? 250 : 300);
  const moderate = aqi > (severe ? 60 : 100);

  if (veryHigh) {
    return {
      advice: hasResp
        ? "Stay in. If they must go out: N95 + medication, under 15 min."
        : "Stay in if possible. N95 and short trips if not.",
      tone: "warn",
    };
  }
  if (hasResp) {
    return high
      ? {
          advice: "No outdoor exercise before 11 AM. N95 + inhaler if they go.",
          tone: "warn",
        }
      : {
          advice: "Keep the inhaler handy. Short walks are fine.",
          tone: "calm",
        };
  }
  if (isChild) {
    return moderate
      ? {
          advice: "Indoor play today. N95 on the school run.",
          tone: "warn",
        }
      : { advice: "Outdoor play is fine today.", tone: "calm" };
  }
  if (isSenior) {
    return high
      ? { advice: "Shift the morning walk to 11 AM–4 PM.", tone: "warn" }
      : { advice: "Morning walk is fine; keep it short.", tone: "calm" };
  }
  if (pregnant) {
    return moderate
      ? {
          advice: "Limit outdoor time and keep windows closed.",
          tone: "warn",
        }
      : { advice: "Short walks are fine today.", tone: "calm" };
  }
  if (key === "good" || key === "satisfactory") {
    return { advice: "Air is okay for normal activity.", tone: "calm" };
  }
  return high
    ? { advice: "Limit outdoor time; N95 if you must go.", tone: "warn" }
    : { advice: "Short trips are fine; mask if sensitive.", tone: "calm" };
}

function familyFor(aqi: number, key: BandKey, profile?: Profile) {
  if (!profile?.family.length) {
    return [
      {
        name: "Father",
        meta: "60+ · asthma",
        advice:
          aqi > 300
            ? "Stay in. If he must go out: N95 + inhaler, under 15 min."
            : aqi > 150
              ? "No walk before 11 AM. N95 + inhaler if he goes."
              : "Walk is fine 10 AM–4 PM. Keep inhaler handy.",
        tone: aqi > 150 ? ("warn" as const) : ("calm" as const),
      },
      {
        name: "Daughter",
        meta: "6-12 · school",
        advice:
          key === "good" || key === "satisfactory"
            ? "Outdoor play is fine today."
            : "Indoor play today. N95 on the school run.",
        tone:
          key === "good" || key === "satisfactory"
            ? ("calm" as const)
            : ("warn" as const),
      },
    ];
  }

  return profile.family.map((member) => {
    const result = adviceForMember(member, aqi, key);
    return {
      name: member.relation,
      meta: `${member.ageBand}${
        member.conditions.length ? ` · ${member.conditions.join(", ")}` : ""
      }${member.severity !== "None" ? ` · ${member.severity}` : ""}`,
      advice: result.advice,
      tone: result.tone,
    };
  });
}

function doNowFor(state: StateEntry, profile?: Profile) {
  const fallback = [
    {
      title: "Clean room, not a new purifier",
      body: "Pick one room, close windows, damp-mop, run a HEPA vacuum if you have one.",
      impact: "Indoor PM ~40-70% lower",
    },
    {
      title: "Run the kitchen exhaust",
      body: "Switch it on 10 minutes after cooking - gas and smoke linger.",
      impact: "Cuts cooking PM peak",
    },
    {
      title: "Skip agarbatti or coil today",
      body: "If you must, light it 8–10 PM with a window cracked open.",
      impact: "Avoids a 3-5x indoor spike",
    },
    {
      title: "Keep the road-side windows shut",
      body: "Ventilate the courtyard side 11 AM–4 PM when wind picks up.",
      impact: "Less traffic dust indoors",
    },
  ];

  if (!profile) {
    const offset = hash(state.code) % fallback.length;
    return [...fallback.slice(offset), ...fallback.slice(0, offset)].slice(0, 3);
  }

  const home = profile.home;
  const items: typeof fallback = [];

  if (home.purifiers === "None" || home.purifiers === "Not sure") {
    items.push(fallback[0]);
  } else {
    items.push({
      title: "Run the purifier where you sit most",
      body: "Close that room’s door and run it on auto during peak hours.",
      impact: "Lower PM in one room",
    });
  }

  if (home.cooking.includes("LPG") || home.cooking.includes("Wood/coal")) {
    items.push(fallback[1]);
  }

  if (
    home.indoorSmoke.some((s) =>
      ["Agarbatti", "Karpooram/havan", "Mosquito coil"].includes(s),
    )
  ) {
    items.push(fallback[2]);
  }

  if (
    home.cleaning.includes("Dry sweeping") &&
    home.cleaningFrequency !== "Rarely"
  ) {
    items.push({
      title: "Damp-mop instead of sweeping",
      body: "Dry sweeping lifts settled dust back into the air you breathe.",
      impact: "Less indoor dust",
    });
  }

  if (home.carpet) {
    items.push({
      title: "Vacuum the carpet with a HEPA filter",
      body: "Carpets hold fine dust. Vacuum slowly, once a week.",
      impact: "Cuts stored dust",
    });
  }

  if (home.damp) {
    items.push({
      title: "Treat damp and mold",
      body: "Fix the leak, air the room, and wipe visible mold with a damp cloth.",
      impact: "Fewer mold spores",
    });
  }

  items.push(fallback[3]);

  const unique = items.filter(
    (item, index) => items.findIndex((x) => x.title === item.title) === index,
  );

  return (unique.length ? unique : fallback).slice(0, 3);
}

function mustGoOutFor(profile?: Profile) {
  if (!profile?.family.length) {
    return [
      {
        name: "Father",
        advice: "Fitted N95 + inhaler, under 15 min, avoid main roads.",
      },
      {
        name: "Daughter",
        advice: "Avoid if possible; if not, N95 and a short route.",
      },
    ];
  }

  return profile.family.slice(0, 3).map((member) => {
    const ageStart = Number.parseInt(member.ageBand, 10);
    const sensitive =
      member.conditions.length > 0 ||
      (Number.isFinite(ageStart) && (ageStart <= 12 || ageStart >= 60));
    const severe = member.severity === "Severe";
    return {
      name: member.relation,
      advice: severe
        ? "Stay in unless essential. If they must go: fitted N95, under 15 min, carry medication."
        : sensitive
          ? "Fitted N95, under 15 min, avoid main roads. Carry medication if prescribed."
          : "N95, short trips, avoid main roads.",
    };
  });
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "recently";

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export function readingFromAir(
  state: StateEntry,
  air: AirReading,
  updatedLabel?: string,
  demo = false,
  profile?: Profile,
): Reading {
  const band = BANDS.find((b) => b.key === air.band) ?? bandFor(air.aqi);
  const high = air.aqi > 150;

  return {
    state,
    area: air.area,
    aqi: air.aqi,
    band,
    dominant: air.dominant,
    basis: air.basis,
    pollutants: air.pollutants.map(({ label, value, unit }) => ({
      label,
      value,
      unit,
    })),
    weather: air.weather,
    source: {
      type: air.source.type,
      station: air.source.station,
      distanceKm: air.source.distanceKm,
      updated: updatedLabel ?? relativeTime(air.source.updatedAt),
    },
    cached: air.cached,
    stale: air.stale,
    degraded: air.degraded,
    fallbackReason: air.fallbackReason,
    nearestStationKm: air.nearestStationKm,
    usAqi: air.usAqi,
    usAqiBasis: air.usAqiBasis,
    nearby: air.nearby,
    stations: air.stations,
    aqiRange: air.aqiRange,
    windows: comfortWindows(band.key),
    demo,
    guidelines: guidelinesFor(air.band),
    family: familyFor(air.aqi, air.band, profile),
    mustGoOut: mustGoOutFor(profile),
    doNow: doNowFor(state, profile),
    impact: high
      ? {
          title: "N95 on the school run",
          value: "~85% less PM2.5 dose",
          note: "Estimate for a 20-minute walk. Fit matters more than the label.",
        }
      : {
          title: `Open windows ${comfortWindows(band.key).best}`,
          value: "~30% lower indoor CO₂",
          note: "When outdoor air is cleaner than indoor, a short cross-breeze helps.",
        },
  };
}

export function mockReading(state: StateEntry, profile?: Profile): Reading {
  const aqi = state.code === "DL" ? 312 : 90 + (hash(state.code) % 290);
  const band = bandFor(aqi);
  const isModel = MODEL_ONLY.has(state.code);

  const air: AirReading = {
    area: state.code === "DL" ? "Anand Vihar" : state.capital,
    aqi,
    band: band.key,
    bandLabel: band.label,
    dominant: "PM2.5",
    basis: "PM2.5/PM10",
    pollutants: [
      { key: "pm25", label: "PM2.5", value: Math.round(aqi * 0.8), unit: "µg/m³" },
      { key: "pm10", label: "PM10", value: Math.round(aqi * 1.2), unit: "µg/m³" },
      { key: "no2", label: "NO₂", value: Math.round(aqi * 0.29), unit: "µg/m³" },
      { key: "so2", label: "SO₂", value: Math.round(aqi * 0.04), unit: "µg/m³" },
      { key: "o3", label: "O₃", value: Math.round(aqi * 0.13), unit: "µg/m³" },
      { key: "co", label: "CO", value: 1.2, unit: "mg/m³" },
    ],
    source: {
      type: isModel ? "model" : "ground",
      station: isModel
        ? "CAMS · model grid"
        : state.code === "DL"
          ? "Anand Vihar · CPCB"
          : `${state.capital} · CPCB`,
      distanceKm: isModel ? 0 : 3.2,
      updatedAt: MOCK_ISO,
    },
    state: {
      code: state.code,
      name: state.name,
      capital: state.capital,
      city: state.capital,
      lat: state.lat,
      lon: state.lon,
    },
    weather: {
      tempC: 24,
      windKph: aqi > 300 ? 3 : 9,
      rain: false,
      code: 0,
      isDay: true,
      condition: "clear",
    },
    fetchedAt: MOCK_ISO,
    cached: false,
    stale: false,
    degraded: false,
  };

  return readingFromAir(state, air, "12 min ago", true, profile);
}
