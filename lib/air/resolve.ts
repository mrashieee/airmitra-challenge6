import type { StateEntry } from "@/lib/states";
import { cacheGet, cacheGetStale, cacheSet } from "./cache";
import { usAqiForPollutants } from "./naqi";
import { fetchCpcb } from "./providers/cpcb";
import { fetchOpenAQ } from "./providers/openaq";
import { fetchNearbySamples, fetchNearbyStations } from "./providers/nearby";
import {
  fetchCityStations,
  mergeApproxSamples,
  mergeCityStations,
} from "./aggregate";
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
    if (cached) {
      // Weather changes faster than the station reading. Refresh only the
      // scene inputs so a cached AQI never freezes yesterday's sky.
      const weather = await withTimeout(
        fetchWeather(place),
        3500,
        cached.weather,
      );
      return { ...cached, weather, cached: true, stale: false };
    }
  }

  // Ground station + weather in parallel. Weather never blocks the reading.
  const [cpcb, openaq, weather] = await Promise.all([
    withTimeout(fetchCpcb(state, process.env.DATA_GOV_API_KEY, place), 6500, {
      sample: null,
      failed: true,
    }),
    withTimeout(fetchOpenAQ(state, place), 7000, {
      sample: null,
      failed: true,
    }),
    fetchWeather(place),
  ]);

  let sample = cpcb.sample ?? openaq.sample;
  let fallbackReason: AirReading["fallbackReason"];
  let nearestStationKm: number | undefined;
  let modelNearby: AirReading["nearby"];
  let cityStations: AirReading["stations"];
  let aqiRange: AirReading["aqiRange"];

  if (!sample) {
    const nearest = cpcb.nearestKm ?? openaq.nearestKm;

    if (cpcb.failed && openaq.failed) {
      fallbackReason = "cpcb_unavailable";
    } else if (cpcb.tooFar || typeof nearest === "number") {
      fallbackReason = "station_too_far";
      nearestStationKm = nearest;
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

    // Prefer up to three real stations within 60 km over a model. Their
    // median is labelled approximate, with the distance range shown.
    const nearbySamples = await withTimeout(
      fetchNearbySamples(place, 3, 60),
      7000,
      [],
    );
    const approximate = mergeApproxSamples(nearbySamples, place.city);

    if (approximate) {
      sample = approximate.sample;
      cityStations = approximate.list;
      aqiRange = approximate.range;
      nearestStationKm = approximate.sample.source.distanceKm;
    } else {
      sample = await fetchOpenMeteoAir(state, place);

      if (sample) {
        const nearby = await withTimeout(
          fetchNearbyStations(place),
          6500,
          [],
        );
        if (nearby.length) modelNearby = nearby;
      }
    }
  }

  if (!sample) throw new Error(`No air data available for ${state.code}`);

  let finalSample = sample;

  if (finalSample.source.type === "ground") {
    const stations = await withTimeout(fetchCityStations(place), 6500, []);
    const merged = mergeCityStations(stations, place.city);
    if (merged) {
      finalSample = merged.sample;
      cityStations = merged.list;
      aqiRange = merged.range;
    }
  }

  const us = usAqiForPollutants(finalSample.pollutants) ?? undefined;

  const reading: AirReading = {
    ...finalSample,
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
    usAqi: us?.aqi,
    usAqiBasis: us?.basis,
    nearby: modelNearby,
    stations: cityStations,
    aqiRange,
  };

  cacheSet(cacheKey, reading, CACHE_TTL_MS);
  return reading;
}
