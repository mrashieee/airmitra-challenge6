import statesJson from "@/data/states.json";
import citiesJson from "@/data/cities.json";

export type StateEntry = {
  code: string;
  name: string;
  type: "state" | "ut";
  capital: string;
  lat: number;
  lon: number;
  region: string;
};

export type CityEntry = {
  name: string;
  lat: number;
  lon: number;
};

const all = statesJson.states as StateEntry[];
const cities = citiesJson as Record<string, CityEntry[]>;

export const STATES = all.filter((s) => s.type === "state");
export const UNION_TERRITORIES = all.filter((s) => s.type === "ut");
export const ALL_STATES = all;

export function findState(code: string): StateEntry {
  return all.find((s) => s.code === code) ?? all.find((s) => s.code === "DL")!;
}

export function citiesFor(code: string): CityEntry[] {
  const state = findState(code);
  return cities[code]?.length
    ? cities[code]
    : [{ name: state.capital, lat: state.lat, lon: state.lon }];
}

export function findCity(code: string, name: string): CityEntry | null {
  const list = citiesFor(code);
  return list.find((c) => c.name === name) ?? list[0] ?? null;
}
