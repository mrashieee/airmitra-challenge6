import type { StateEntry } from "@/lib/states";
import type { Target } from "../types";
import {
  bandFor,
  computeAqi,
  POLLUTANT_LABELS,
  POLLUTANT_UNITS,
  type PollutantKey,
  type PollutantValue,
} from "../naqi";
import type { AirSample, AirWeather, WeatherCondition } from "../types";

const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

type OpenMeteoCurrent = {
  time?: string;
  pm2_5?: number | null;
  pm10?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  ozone?: number | null;
  carbon_monoxide?: number | null;
};

type OpenMeteoAirResponse = {
  current?: OpenMeteoCurrent;
  utc_offset_seconds?: number;
  error?: boolean;
};

type OpenMeteoWeatherResponse = {
  current?: {
    temperature_2m?: number | null;
    wind_speed_10m?: number | null;
    precipitation?: number | null;
    rain?: number | null;
    is_day?: number | null;
    weather_code?: number | null;
    cloud_cover?: number | null;
  };
};

function conditionFor(code: number | null): WeatherCondition {
  if (code === null) return "clear";
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloudy";
}

const FIELD_MAP: Array<[keyof OpenMeteoCurrent, PollutantKey]> = [
  ["pm2_5", "pm25"],
  ["pm10", "pm10"],
  ["nitrogen_dioxide", "no2"],
  ["sulphur_dioxide", "so2"],
  ["ozone", "o3"],
  ["carbon_monoxide", "co"],
];

export async function fetchOpenMeteoAir(
  state: StateEntry,
  target?: Target,
): Promise<AirSample | null> {
  const place = target ?? {
    lat: state.lat,
    lon: state.lon,
    city: state.capital,
  };

  const url = new URL(AIR_URL);
  url.searchParams.set("latitude", String(place.lat));
  url.searchParams.set("longitude", String(place.lon));
  url.searchParams.set(
    "current",
    "pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide",
  );
  url.searchParams.set("timezone", "auto");

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as OpenMeteoAirResponse;
    const current = json.current;
    if (!current) return null;

    const pollutants: PollutantValue[] = [];
    for (const [field, key] of FIELD_MAP) {
      const raw = current[field];
      if (typeof raw !== "number" || !Number.isFinite(raw)) continue;

      // Open-Meteo CO is µg/m³; CPCB breakpoints use mg/m³.
      const value = key === "co" ? raw / 1000 : raw;

      pollutants.push({
        key,
        label: POLLUTANT_LABELS[key],
        value,
        unit: POLLUTANT_UNITS[key],
      });
    }

    const pmOnly = pollutants.filter(
      (p) => p.key === "pm25" || p.key === "pm10",
    );
    const result = computeAqi(pmOnly.length ? pmOnly : pollutants);
    if (!result) return null;

    const band = bandFor(result.aqi);

    // Use the model's own timestamp, not "now", and refuse stale model data.
    const offsetMs = (json.utc_offset_seconds ?? 0) * 1000;
    const timestamp = current.time
      ? Date.parse(`${current.time}Z`) - offsetMs
      : Number.NaN;
    if (!Number.isFinite(timestamp)) return null;
    if (Date.now() - timestamp > 3 * 60 * 60 * 1000) return null;

    return {
      area: place.city,
      aqi: result.aqi,
      band: band.key,
      bandLabel: band.label,
      dominant: result.dominant,
      basis: pmOnly.length ? "PM2.5/PM10" : "mixed",
      pollutants,
      source: {
        type: "model",
        station: "CAMS · model grid",
        distanceKm: 0,
        updatedAt: new Date(timestamp).toISOString(),
      },
    };
  } catch {
    return null;
  }
}

export async function fetchWeather(target: Target): Promise<AirWeather> {
  const url = new URL(WEATHER_URL);
  url.searchParams.set("latitude", String(target.lat));
  url.searchParams.set("longitude", String(target.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,wind_speed_10m,precipitation,rain,is_day,weather_code,cloud_cover",
  );
  url.searchParams.set("timezone", "auto");

  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return {
        tempC: null,
        windKph: null,
        rain: false,
        code: null,
        isDay: true,
        condition: "clear",
      };
    }

    const json = (await res.json()) as OpenMeteoWeatherResponse;
    const current = json.current;
    const code =
      typeof current?.weather_code === "number" ? current.weather_code : null;
    const isDay = current?.is_day !== 0;
    let condition = conditionFor(code);
    const precipitation =
      typeof current?.precipitation === "number" ? current.precipitation : 0;
    const rainAmount = typeof current?.rain === "number" ? current.rain : 0;
    const cloudCover =
      typeof current?.cloud_cover === "number" ? current.cloud_cover : 0;

    // Weather models flag light drizzle/showers at a coarse grid point long
    // before anything reaches the ground where the user is standing. Only
    // show a rain scene for rain that is actually meaningful.
    const showers = [80, 81, 82].includes(code ?? -1);
    const rainThreshold =
      condition === "drizzle" ? 1 : showers ? 1 : 0.5;
    const meaningfulRain =
      precipitation >= rainThreshold || rainAmount >= rainThreshold;
    if (!meaningfulRain && (condition === "drizzle" || condition === "rain")) {
      condition =
        cloudCover >= 75 ? "cloudy" : cloudCover >= 35 ? "partly" : "clear";
    }

    return {
      tempC:
        typeof current?.temperature_2m === "number"
          ? Math.round(current.temperature_2m)
          : null,
      windKph:
        typeof current?.wind_speed_10m === "number"
          ? Math.round(current.wind_speed_10m)
          : null,
      rain:
        meaningfulRain ||
        condition === "rain" ||
        condition === "drizzle" ||
        condition === "thunder",
      code,
      isDay,
      condition,
    };
  } catch {
    return {
      tempC: null,
      windKph: null,
      rain: false,
      code: null,
      isDay: true,
      condition: "clear",
    };
  }
}
