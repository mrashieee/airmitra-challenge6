"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/profile";
import type { Brief } from "./types";

type Args = {
  profile: Profile;
  state: string;
  city: string;
  lat: number;
  lon: number;
};

export function useBrief({ profile, state, city, lat, lon }: Args) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, state, city, lat, lon }),
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
  }, [profile, state, city, lat, lon]);

  const current = brief?.city === city ? brief : null;

  return {
    brief: current,
    loading: !current && !error,
    error,
  };
}
