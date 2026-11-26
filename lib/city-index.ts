import cityIndex from "@/data/city-index.json";
import type { CitySuggestion, CrossStateSuggestion } from "./search-types";
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

/** Common English / former names people still search for. */
const ALIASES: Record<string, string> = {
  trivandrum: "thiruvananthapuram",
  bangalore: "bengaluru",
  bombay: "mumbai",
  calcutta: "kolkata",
  madras: "chennai",
  cochin: "kochi",
  calicut: "kozhikode",
  palghat: "palakkad",
  trichur: "thrissur",
  quilon: "kollam",
  alleppey: "alappuzha",
  cannanore: "kannur",
  mysore: "mysuru",
  mangalore: "mangaluru",
  belgaum: "belagavi",
  hubli: "hubballi",
  gulbarga: "kalaburagi",
  shimoga: "shivamogga",
  tumkur: "tumakuru",
  baroda: "vadodara",
  poona: "pune",
  benares: "varanasi",
  banaras: "varanasi",
  allahabad: "prayagraj",
  cawnpore: "kanpur",
  simla: "shimla",
  gurgaon: "gurugram",
  tanjore: "thanjavur",
  tuticorin: "thoothukudi",
  pondicherry: "puducherry",
  ootacamund: "ooty",
  vizag: "visakhapatnam",
};

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

/** Bounded Levenshtein distance for typo tolerance. */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const previous = new Array(b.length + 1);
  const current = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function ranked(
  pool: RawEntry[],
  query: string,
  limit: number,
): RawEntry[] {
  const q = normaliseCity(query);
  if (q.length < 2) return [];

  const scored = pool
    .map((entry) => ({ entry, value: score(entry, q) }))
    .filter((row) => row.value > 0);

  let rows = scored;

  // Former / English names: "trivandrum" -> "thiruvananthapuram".
  if (!rows.length && ALIASES[q]) {
    const alias = ALIASES[q];
    rows = pool
      .map((entry) => ({ entry, value: score(entry, alias) }))
      .filter((row) => row.value > 0);
  }

  // Typo tolerance, last resort.
  if (!rows.length && q.length >= 4) {
    rows = pool
      .map((entry) => {
        const name = normaliseCity(entry.n);
        const distance = editDistance(q, name);
        return { entry, value: distance <= 2 ? 900_000 - distance * 50_000 : 0 };
      })
      .filter((row) => row.value > 0);
  }

  return rows
    .sort(
      (a, b) =>
        b.value - a.value ||
        b.entry.p - a.entry.p ||
        a.entry.n.localeCompare(b.entry.n),
    )
    .slice(0, limit)
    .map((row) => row.entry);
}

export function searchCities(
  stateCode: string,
  query: string,
  limit = 8,
): CitySuggestion[] {
  const state = stateCode.toUpperCase();
  return ranked(
    entries.filter((entry) => entry.s === state),
    query,
    limit,
  ).map(toSuggestion);
}

/** When nothing matches in the selected state, suggest where the place is. */
export function searchOtherStates(
  stateCode: string,
  query: string,
  limit = 3,
): CrossStateSuggestion[] {
  const state = stateCode.toUpperCase();
  return ranked(
    entries.filter((entry) => entry.s !== state),
    query,
    limit,
  ).map((entry) => ({
    ...toSuggestion(entry),
    stateCode: entry.s,
    stateName: findState(entry.s).name,
  }));
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
