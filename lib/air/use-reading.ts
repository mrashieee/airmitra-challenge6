"use client";

import { useEffect, useState } from "react";
import type { AirReading } from "./types";

export function useAirReading(
  code: string,
  lat: number,
  lon: number,
  city: string,
) {
  const [data, setData] = useState<AirReading | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      state: code,
      lat: String(lat),
      lon: String(lon),
      city,
    });

    fetch(`/api/aqi?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as AirReading;
      })
      .then((reading) => {
        setData(reading);
        setError(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setError(true);
      });

    return () => controller.abort();
  }, [code, lat, lon, city]);

  const current =
    data?.state.code === code && data.state.city === city ? data : null;

  return {
    data: current,
    error,
    loading: !current,
  };
}
