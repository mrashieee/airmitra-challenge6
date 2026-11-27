"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/profile";
import type { Brief } from "./types";

type Args = {
  profile: Profile;
  state: string;
  city: string;
  lat: number;
  lon: number;
};

const REFRESH_MS = 60 * 60 * 1000;

export function useBrief({ profile, state, city, lat, lon }: Args) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const lastFetched = useRef(0);
  const forceNext = useRef(false);

  // Regenerate hourly so the GenAI advice follows the time of day.
  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), REFRESH_MS);
    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastFetched.current > REFRESH_MS - 15 * 60 * 1000
      ) {
        setTick((value) => value + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    lastFetched.current = Date.now();
    const force = forceNext.current;
    forceNext.current = false;

    fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, state, city, lat, lon, force }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Brief;
      })
      .then((data) => {
        setBrief(data);
        setError(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setError(true);
      });

    return () => controller.abort();
  }, [profile, state, city, lat, lon, tick]);

  const current = brief?.city === city ? brief : null;

  return {
    brief: current,
    loading: !current && !error,
    error,
    refresh: () => {
      forceNext.current = true;
      setTick((value) => value + 1);
    },
  };
}
