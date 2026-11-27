import type { AirReading } from "@/lib/air/types";
import { comfortWindows } from "@/lib/air/naqi";
import type { Profile } from "@/lib/profile";
import type { StateEntry } from "@/lib/states";
import { bandLabel, optionLabel } from "@/lib/i18n";
import { indiaHour, periodFor } from "@/lib/time";

export type AiContext = {
  location: { city: string; state: string };
  aqi: number;
  band: string;
  dominant: string;
  basis: string;
  pollutants: { label: string; value: number; unit: string }[];
  weather: {
    tempC: number | null;
    windKph: number | null;
    rain: boolean;
    condition: string;
    isDay: boolean;
  };
  source: {
    type: "ground" | "approximate" | "model";
    station: string;
    distanceKm: number;
    nearestCpcbKm?: number;
  };
  family: {
    relation: string;
    ageBand: string;
    conditions: string[];
    severity: string;
  }[];
  home: Profile["home"];
  routine: Profile["routine"];
  time: { hour: number; part: string; date: string };
  windows: { best: string; avoid: string };
};

export function buildContext(
  state: StateEntry,
  air: AirReading,
  profile: Profile,
  now = new Date(),
): AiContext {
  const hour = indiaHour(now);
  const part = periodFor(now);

  return {
    location: { city: air.state.city, state: state.name },
    aqi: air.aqi,
    band: bandLabel(profile.language, air.band),
    dominant: air.dominant,
    basis: air.basis,
    pollutants: air.pollutants
      .filter((p) => p.label !== "CO")
      .slice(0, 6)
      .map(({ label, value, unit }) => ({ label, value, unit })),
    weather: {
      tempC: air.weather.tempC,
      windKph: air.weather.windKph,
      rain: air.weather.rain,
      condition: air.weather.condition,
      isDay: air.weather.isDay,
    },
    source: {
      type: air.source.type,
      station: air.source.station,
      distanceKm: air.source.distanceKm,
      nearestCpcbKm: air.nearestStationKm,
    },
    family: profile.family.map((m) => ({
      relation: optionLabel(profile.language, "relation", m.relation),
      ageBand: m.ageBand,
      conditions: m.conditions.map((condition) =>
        optionLabel(profile.language, "condition", condition),
      ),
      severity: optionLabel(profile.language, "severity", m.severity),
    })),
    home: profile.home,
    routine: profile.routine,
    windows: comfortWindows(air.band),
    time: {
      hour,
      part,
      date: now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }),
    },
  };
}

export function contextJson(context: AiContext): string {
  return JSON.stringify(context);
}
