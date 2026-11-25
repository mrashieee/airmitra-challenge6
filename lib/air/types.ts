import type { BandKey, PollutantValue } from "./naqi";

export type AirSourceType = "ground" | "model";

export type AirSource = {
  type: AirSourceType;
  station: string;
  distanceKm: number;
  updatedAt: string;
};

export type WeatherCondition =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "thunder"
  | "snow";

export type AirWeather = {
  tempC: number | null;
  windKph: number | null;
  rain: boolean;
  code: number | null;
  isDay: boolean;
  condition: WeatherCondition;
};

/** One station/model sample, before state + weather are attached. */
export type AirSample = {
  area: string;
  aqi: number;
  band: BandKey;
  bandLabel: string;
  dominant: string;
  basis: string;
  pollutants: PollutantValue[];
  source: AirSource;
};

export type Target = {
  lat: number;
  lon: number;
  city: string;
};

export type AirReading = AirSample & {
  state: {
    code: string;
    name: string;
    capital: string;
    city: string;
    lat: number;
    lon: number;
  };
  weather: AirWeather;
  fetchedAt: string;
  cached: boolean;
  stale: boolean;
  degraded: boolean;
  fallbackReason?:
    | "no_station"
    | "cpcb_unavailable"
    | "cams_unavailable"
    | "station_too_far";
  nearestStationKm?: number;
};
