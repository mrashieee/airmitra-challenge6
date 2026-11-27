import { BANDS, bandFor, comfortWindows } from "@/lib/air/naqi";
import { bandLabel, localeTag, optionLabel, t } from "@/lib/i18n";
import type { Band, BandKey } from "@/lib/air/naqi";
import type { AirReading, NearbyStation } from "@/lib/air/types";
import type { FamilyMember, Profile } from "./profile";
import type { StateEntry } from "./states";

export { BANDS, bandFor };
export type { Band, BandKey };

export type Reading = {
  language: string;
  state: StateEntry;
  area: string;
  aqi: number;
  band: Band;
  dominant: string;
  basis?: string;
  pollutants: { label: string; value: number; unit: string }[];
  weather: AirReading["weather"];
  source: {
    type: "ground" | "approximate" | "model";
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
  helpTheAir: { title: string; body: string }[];
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

function guidelinesFor(key: BandKey, language: string): string[] {
  const { best, avoid } = comfortWindows(key);

  if (key === "severe" || key === "veryPoor") {
    return [
      t(language, "r.guide.severe.0", { avoid }),
      t(language, "r.guide.severe.1"),
      t(language, "r.guide.severe.2", { best }),
    ];
  }
  if (key === "poor" || key === "moderate") {
    return [
      t(language, "r.guide.poor.0", { best, avoid }),
      t(language, "r.guide.poor.1"),
      t(language, "r.guide.poor.2"),
    ];
  }
  return [
    t(language, "r.guide.good.0", { best }),
    t(language, "r.guide.good.1"),
    t(language, "r.guide.good.2", { avoid }),
  ];
}

function adviceForMember(
  member: FamilyMember,
  aqi: number,
  key: BandKey,
  language: string,
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
      advice: t(
        language,
        hasResp ? "r.advice.veryHighResp" : "r.advice.veryHigh",
      ),
      tone: "warn",
    };
  }
  if (hasResp) {
    return high
      ? { advice: t(language, "r.advice.respHigh"), tone: "warn" }
      : { advice: t(language, "r.advice.respCalm"), tone: "calm" };
  }
  if (isChild) {
    return moderate
      ? { advice: t(language, "r.advice.childWarn"), tone: "warn" }
      : { advice: t(language, "r.advice.childCalm"), tone: "calm" };
  }
  if (isSenior) {
    return high
      ? { advice: t(language, "r.advice.seniorWarn"), tone: "warn" }
      : { advice: t(language, "r.advice.seniorCalm"), tone: "calm" };
  }
  if (pregnant) {
    return moderate
      ? { advice: t(language, "r.advice.pregnantWarn"), tone: "warn" }
      : { advice: t(language, "r.advice.pregnantCalm"), tone: "calm" };
  }
  if (key === "good" || key === "satisfactory") {
    return { advice: t(language, "r.advice.good"), tone: "calm" };
  }
  return high
    ? { advice: t(language, "r.advice.genericWarn"), tone: "warn" }
    : { advice: t(language, "r.advice.genericCalm"), tone: "calm" };
}

function familyFor(
  aqi: number,
  key: BandKey,
  profile: Profile | undefined,
  language: string,
) {
  if (!profile?.family.length) return [];

  return profile.family.map((member) => {
    const result = adviceForMember(member, aqi, key, language);
    const meta = [
      member.ageBand,
      member.conditions
        .map((condition) => optionLabel(language, "condition", condition))
        .join(", "),
      member.severity !== "None"
        ? optionLabel(language, "severity", member.severity)
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      name: optionLabel(language, "relation", member.relation),
      meta,
      advice: result.advice,
      tone: result.tone,
    };
  });
}

function doNowFor(state: StateEntry, profile: Profile | undefined, language: string) {
  const item = (key: string) => ({
    title: t(language, `r.do.${key}.title`),
    body: t(language, `r.do.${key}.body`),
    impact: t(language, `r.do.${key}.impact`),
  });

  const fallback = [
    item("clean"),
    item("exhaust"),
    item("smoke"),
    item("road"),
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
    items.push(item("purifier"));
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
    items.push(item("mop"));
  }

  if (home.carpet) {
    items.push(item("carpet"));
  }

  if (home.damp) {
    items.push(item("damp"));
  }

  items.push(fallback[3]);

  const unique = items.filter(
    (entry, index) => items.findIndex((x) => x.title === entry.title) === index,
  );

  return (unique.length ? unique : fallback).slice(0, 3);
}

function mustGoOutFor(profile: Profile | undefined, language: string) {
  if (!profile?.family.length) {
    return [
      {
        name: t(language, "r.must.anyone.name"),
        advice: t(language, "r.must.anyone.advice"),
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
      name: optionLabel(language, "relation", member.relation),
      advice: severe
        ? t(language, "r.must.severe")
        : sensitive
          ? t(language, "r.must.sensitive")
          : t(language, "r.must.normal"),
    };
  });
}

function helpTheAirFor(profile: Profile | undefined, language: string) {
  const plant = {
    title: t(language, "r.help.plant.title"),
    body: t(language, "r.help.plant.body"),
  };
  const drives = profile?.routine.commute.some((mode) =>
    ["Car", "Two-wheeler", "Auto"].includes(mode),
  );
  const second = drives
    ? {
        title: t(language, "r.help.commute.title"),
        body: t(language, "r.help.commute.body"),
      }
    : {
        title: t(language, "r.help.compost.title"),
        body: t(language, "r.help.compost.body"),
      };
  return [plant, second];
}

function relativeTime(iso: string, language: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return t(language, "time.recently");

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return t(language, "time.justNow");
  if (minutes < 60) return t(language, "time.minAgo", { n: minutes });

  const hours = Math.round(minutes / 60);
  if (hours < 24) return t(language, "time.hoursAgo", { n: hours });

  return new Date(iso).toLocaleDateString(localeTag(language), {
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
  const language = profile?.language ?? "English";
  const band = BANDS.find((b) => b.key === air.band) ?? bandFor(air.aqi);
  const high = air.aqi > 150;
  const windows = comfortWindows(band.key);
  const hasChild = (profile?.family ?? []).some(
    (member) => Number.parseInt(member.ageBand, 10) <= 12,
  );

  return {
    language,
    state,
    area: air.area,
    aqi: air.aqi,
    band: { ...band, label: bandLabel(language, band.key) },
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
      updated: updatedLabel ?? relativeTime(air.source.updatedAt, language),
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
    windows,
    demo,
    guidelines: guidelinesFor(air.band, language),
    family: familyFor(air.aqi, air.band, profile, language),
    mustGoOut: mustGoOutFor(profile, language),
    doNow: doNowFor(state, profile, language),
    helpTheAir: helpTheAirFor(profile, language),
    impact: high
      ? {
          title: t(
            language,
            hasChild ? "r.impact.school.title" : "r.impact.errand.title",
          ),
          value: t(language, "r.impact.high.value"),
          note: t(language, "r.impact.high.note"),
        }
      : {
          title: t(language, "r.impact.open.title", { best: windows.best }),
          value: t(language, "r.impact.low.value"),
          note: t(language, "r.impact.low.note"),
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
