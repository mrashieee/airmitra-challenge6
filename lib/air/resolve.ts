import type { StateEntry } from "@/lib/states";
import { cacheGet, cacheGetStale, cacheSet } from "./cache";
import { fetchCpcb } from "./providers/cpcb";
import { fetchOpenAQ } from "./providers/openaq";
import { fetchOpenMeteoAir, fetchWeather } from "./providers/openmeteo";
import type { AirReading, Target } from "./types";

const TTL_SECONDS = Math.max(60, Number(process.env.AQI_CACHE_TTL_SECONDS ?? 900));
const CACHE_TTL_MS = TTL_SECONDS * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

export async function resolveAirReading(
  state: StateEntry,
  options: { fresh?: boolean; target?: Target } = {},
): Promise<AirReading> {
  const place = options.target ?? {
    lat: state.lat,
    lon: state.lon,
    city: state.capital,
  };
  const cacheKey = `air:${state.code}:${place.city}`;

  if (!options.fresh) {
    const cached = cacheGet<AirReading>(cacheKey);
    if (cached) return { ...cached, cached: true, stale: false };
  }

  // Ground station + weather in parallel. Weather never blocks the reading.
  const [cpcb, openaq, weather] = await Promise.all([
    withTimeout(fetchCpcb(state, process.env.DATA_GOV_API_KEY, place), 6500, {
      sample: null,
      failed: true,
    }),
    withTimeout(fetchOpenAQ(state, place), 7000, null),
    fetchWeather(place),
  ]);

  let sample = cpcb.sample ?? openaq;
  let fallbackReason: AirReading["fallbackReason"];
  let nearestStationKm: number | undefined;

  if (!sample) {
    if (cpcb.failed) {
      fallbackReason = "cpcb_unavailable";
    } else if (cpcb.tooFar) {
      fallbackReason = "station_too_far";
      nearestStationKm = cpcb.nearestKm;
    } else {
      fallbackReason = "no_station";
    }

    // Prefer a stale ground reading over a fresh model estimate.
    if (fallbackReason === "cpcb_unavailable") {
      const stale = cacheGetStale<AirReading>(cacheKey);
      if (stale?.source.type === "ground") {
        return {
          ...stale,
          cached: true,
          stale: true,
          degraded: true,
          fallbackReason,
        };
      }
    }

    sample = await fetchOpenMeteoAir(state, place);
  }

  if (!sample) throw new Error(`No air data available for ${state.code}`);

  const reading: AirReading = {
    ...sample,
    state: {
      code: state.code,
      name: state.name,
      capital: state.capital,
      city: place.city,
      lat: place.lat,
      lon: place.lon,
    },
    weather,
    fetchedAt: new Date().toISOString(),
    cached: false,
    stale: false,
    degraded: fallbackReason === "cpcb_unavailable" || fallbackReason === "cams_unavailable",
    fallbackReason,
    nearestStationKm,
  };

  cacheSet(cacheKey, reading, CACHE_TTL_MS);
  return reading;
}
