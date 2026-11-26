/**
 * Builds data/city-index.json:
 *   - important Indian cities from GeoNames (population >= 50,000)
 *   - state capitals and curated cities as a safety net
 *   - CPCB station cities
 *   - each city is tagged with the nearest available ground monitor (CPCB/OpenAQ)
 *
 * Run: node scripts/build-city-index.mjs
 * Requires DATA_GOV_API_KEY and OPENAQ_API_KEY in repo/.env (or the environment).
 */
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(os.tmpdir(), "airmitra-city-index");
const run = promisify(execFile);

const CPCB_URL =
  "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

function normalise(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

function distanceKm(a, b) {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

async function env() {
  const out = { ...process.env };
  try {
    const file = await readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of file.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !out[match[1]]) {
        out[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // no .env — assume the environment has the keys
  }
  return out;
}

async function download(url, target) {
  try {
    const info = await stat(target);
    if (info.size > 0) return target;
  } catch {
    // not cached yet
  }
  console.log(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(target));
  return target;
}

async function loadStates() {
  const json = JSON.parse(await readFile(path.join(ROOT, "data/states.json"), "utf8"));
  return json.states;
}

async function loadCuratedCities() {
  return JSON.parse(await readFile(path.join(ROOT, "data/cities.json"), "utf8"));
}

function stateCodeForName(name, states) {
  const wanted = normalise(name);
  const exact = states.find((state) => normalise(state.name) === wanted);
  if (exact) return exact.code;

  const loose = states.find((state) => {
    const candidate = normalise(state.name);
    return candidate.startsWith(wanted) || wanted.startsWith(candidate);
  });
  return loose?.code ?? null;
}

async function fetchCpcbStations(key) {
  if (!key) {
    console.warn("no DATA_GOV_API_KEY, skipping CPCB stations");
    return [];
  }
  const url = new URL(CPCB_URL);
  url.searchParams.set("api-key", key);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5000");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CPCB -> ${res.status}`);
  const data = await res.json();

  const seen = new Map();
  for (const row of data.records ?? []) {
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const station = String(row.station ?? "").trim();
    if (!station) continue;
    seen.set(`${station}|${lat.toFixed(4)}|${lon.toFixed(4)}`, {
      station,
      city: String(row.city ?? "").trim(),
      state: String(row.state ?? "").trim(),
      lat,
      lon,
    });
  }
  return [...seen.values()];
}

async function fetchOpenAQLocations(key) {
  if (!key) {
    console.warn("no OPENAQ_API_KEY, skipping OpenAQ locations");
    return [];
  }
  const res = await fetch(
    "https://api.openaq.org/v3/locations?countries_id=9&limit=1000",
    { headers: { "X-API-Key": key } },
  );
  if (!res.ok) throw new Error(`OpenAQ -> ${res.status}`);
  const data = await res.json();
  return (data.results ?? [])
    .map((loc) => ({
      station: String(loc.name ?? "").trim(),
      lat: loc.coordinates?.latitude,
      lon: loc.coordinates?.longitude,
    }))
    .filter(
      (loc) =>
        loc.station &&
        typeof loc.lat === "number" &&
        typeof loc.lon === "number",
    );
}

async function loadGeonames(states) {
  await mkdir(CACHE, { recursive: true });
  const zip = path.join(CACHE, "IN.zip");
  await download("https://download.geonames.org/export/dump/IN.zip", zip);

  const list = await run("unzip", ["-p", zip, "IN.txt"], {
    maxBuffer: 256 * 1024 * 1024,
  });
  const adminRaw = await (
    await fetch("https://download.geonames.org/export/dump/admin1CodesASCII.txt")
  ).text();

  const adminToName = new Map();
  for (const line of adminRaw.split("\n")) {
    const [code, name] = line.split("\t");
    if (code?.startsWith("IN.")) adminToName.set(code.slice(3), name);
  }

  const byStateCode = [];
  for (const line of list.stdout.split("\n")) {
    const f = line.split("\t");
    if (f.length < 19) continue;
    if (f[6] !== "P") continue;
    const population = Number(f[14] || 0);
    if (population < 50_000) continue;

    const stateName = adminToName.get(f[10]);
    const code = stateName ? stateCodeForName(stateName, states) : null;
    if (!code) continue;

    byStateCode.push({
      code,
      name: f[2] || f[1],
      lat: Number(f[4]),
      lon: Number(f[5]),
      population,
    });
  }
  return byStateCode;
}

function addCity(list, city) {
  const key = `${city.code}|${normalise(city.name)}`;
  const existing = list.get(key);
  if (!existing) {
    list.set(key, { ...city });
    return;
  }
  if ((city.population ?? 0) > (existing.population ?? 0)) {
    existing.population = city.population ?? existing.population;
    existing.lat = city.lat;
    existing.lon = city.lon;
  }
  existing.featured = existing.featured || city.featured;
  existing.station = existing.station ?? city.station;
}

function summariseIndex(cities) {
  const withStation = cities.filter((city) => city.monitor).length;
  const states = new Set(cities.map((city) => city.code));
  console.log(
    `index: ${cities.length} cities, ${withStation} with a ground monitor, ${states.size} states/UTs`,
  );
}

async function main() {
  const keys = await env();
  const states = await loadStates();
  const curated = await loadCuratedCities();

  const [cpcb, openaq, geonames] = await Promise.all([
    fetchCpcbStations(keys.DATA_GOV_API_KEY),
    fetchOpenAQLocations(keys.OPENAQ_API_KEY),
    loadGeonames(states),
  ]);
  console.log(
    `sources: ${geonames.length} geonames cities, ${cpcb.length} CPCB stations, ${openaq.length} OpenAQ stations`,
  );

  const cities = new Map();

  for (const city of geonames) {
    addCity(cities, { ...city, monitor: null, station: null, featured: 0 });
  }

  for (const state of states) {
    addCity(cities, {
      code: state.code,
      name: state.capital,
      lat: state.lat,
      lon: state.lon,
      population: 0,
      monitor: null,
      station: null,
      featured: 1,
    });
  }

  for (const [code, entries] of Object.entries(curated)) {
    for (const city of entries) {
      addCity(cities, {
        code,
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        population: 0,
        monitor: null,
        station: null,
        featured: 1,
      });
    }
  }

  for (const station of cpcb) {
    const code = stateCodeForName(station.state, states);
    if (!code || !station.city) continue;
    addCity(cities, {
      code,
      name: station.city,
      lat: station.lat,
      lon: station.lon,
      population: 0,
      monitor: "CPCB",
      station: station.station,
      featured: 0,
    });
  }

  // A city is "station-backed" when a ground monitor is close enough to
  // represent it: CPCB within 30 km, otherwise OpenAQ within 25 km.
  const list = [...cities.values()];
  for (const city of list) {
    if (city.monitor) continue;

    let best = null;
    for (const station of cpcb) {
      const d = distanceKm(city, station);
      if (d <= 30 && (!best || d < best.d)) best = { d, station: station.station };
    }
    if (best) {
      city.monitor = "CPCB";
      city.station = best.station;
      continue;
    }

    for (const station of openaq) {
      const d = distanceKm(city, station);
      if (d <= 25 && (!best || d < best.d)) best = { d, station: station.station };
    }
    if (best) {
      city.monitor = "OPENAQ";
      city.station = best.station;
    }
  }

  list.sort(
    (a, b) =>
      a.code.localeCompare(b.code) ||
      b.population - a.population ||
      a.name.localeCompare(b.name),
  );

  summariseIndex(list);

  const output = {
    generatedAt: new Date().toISOString(),
    sources: ["GeoNames (CC BY 4.0)", "CPCB via data.gov.in", "OpenAQ"],
    cities: list.map((city) => ({
      s: city.code,
      n: city.name,
      lat: Math.round(city.lat * 10_000) / 10_000,
      lon: Math.round(city.lon * 10_000) / 10_000,
      p: city.population || 0,
      f: city.featured ? 1 : 0,
      m: city.monitor,
      st: city.station,
    })),
  };

  await writeFile(
    path.join(ROOT, "data/city-index.json"),
    `${JSON.stringify(output)}\n`,
  );
  console.log("wrote data/city-index.json");
}

await main();
