import cityIndex from "@/data/city-index.json";
import type { CitySuggestion } from "./search-types";
import { findState } from "./states";

type RawEntry = {
  s: string;
  n: string;
  lat: number;
  lon: number;
  p: number;
  f: 0 | 1;
  m: "CPCB" | "OPENAQ" | null;
  st: string | null;
};

const entries = cityIndex.cities as RawEntry[];

export function normaliseCity(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function toSuggestion(entry: RawEntry): CitySuggestion {
  return {
    id: `${entry.s}-${entry.n}`,
    name: entry.n,
    admin1: undefined,
    latitude: entry.lat,
    longitude: entry.lon,
    monitor: entry.m,
    station: entry.st,
  };
}

function score(entry: RawEntry, query: string): number {
  const name = normaliseCity(entry.n);
  const lengthPenalty = Math.max(0, name.length - query.length);

  let bucket: number;
  if (name === query) bucket = 3_000_000;
  else if (name.startsWith(query)) bucket = 2_000_000 - lengthPenalty * 100;
  else if (name.includes(query)) bucket = 1_000_000 - lengthPenalty * 100;
  else return 0;

  // Prefer places a monitor actually covers, then larger places. Population is
  // capped so a megacity does not outrank an exact match.
  const monitorBonus = entry.m ? 200 : 0;
  const populationBonus = Math.min(entry.p, 20_000_000) / 500;

  return bucket + monitorBonus + populationBonus;
}

export function searchCities(
  stateCode: string,
  query: string,
  limit = 8,
): CitySuggestion[] {
  const q = normaliseCity(query);
  if (q.length < 2) return [];

  const state = stateCode.toUpperCase();
  return entries
    .filter((entry) => entry.s === state)
    .map((entry) => ({ entry, value: score(entry, q) }))
    .filter((row) => row.value > 0)
    .sort(
      (a, b) =>
        b.value - a.value ||
        b.entry.p - a.entry.p ||
        a.entry.n.localeCompare(b.entry.n),
    )
    .slice(0, limit)
    .map((row) => toSuggestion(row.entry));
}

export function topCities(stateCode: string, limit = 6): CitySuggestion[] {
  const state = stateCode.toUpperCase();
  const inState = entries.filter((entry) => entry.s === state);

  const capital = normaliseCity(findState(state).capital);
  const isCapital = (entry: RawEntry) => Number(normaliseCity(entry.n) === capital);

  const rank = (a: RawEntry, b: RawEntry) =>
    isCapital(b) - isCapital(a) ||
    b.f - a.f ||
    Number(Boolean(b.m)) - Number(Boolean(a.m)) ||
    b.p - a.p ||
    a.n.localeCompare(b.n);

  const monitored = inState
    .filter((entry) => entry.m)
    .sort(rank)
    .slice(0, limit);

  if (monitored.length >= Math.min(4, limit)) return monitored.map(toSuggestion);

  const seen = new Set(monitored.map((entry) => entry.n));
  const filler = inState
    .sort(rank)
    .filter((entry) => !seen.has(entry.n))
    .slice(0, limit - monitored.length);

  return [...monitored, ...filler].map(toSuggestion);
}

export function stationCount(stateCode: string): number {
  const state = stateCode.toUpperCase();
  return entries.filter((entry) => entry.s === state && entry.m).length;
}
