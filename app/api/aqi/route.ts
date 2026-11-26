import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import {
  cleanText,
  indiaCoords,
  limited,
  rateLimit,
} from "@/lib/api-guard";
import { resolveAirReading } from "@/lib/air/resolve";
import type { Target } from "@/lib/air/types";

export async function GET(request: NextRequest) {
  const gate = rateLimit("aqi", request, 120, 60_000);
  if (!gate.ok) return limited(gate.retryAfter);

  const code =
    cleanText(request.nextUrl.searchParams.get("state"), 4).toUpperCase() ||
    "DL";
  const state = ALL_STATES.find((s) => s.code === code);

  if (!state) {
    return Response.json({ error: "Unknown state code", code }, { status: 400 });
  }

  const city =
    cleanText(request.nextUrl.searchParams.get("city"), 80) || state.capital;
  const latParam = request.nextUrl.searchParams.get("lat");
  const lonParam = request.nextUrl.searchParams.get("lon");
  const coords = indiaCoords(latParam, lonParam);
  if (latParam !== null && lonParam !== null && !coords) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  const target: Target | undefined = coords
    ? { ...coords, city }
    : undefined;

  try {
    const reading = await resolveAirReading(state, {
      fresh: request.nextUrl.searchParams.get("fresh") === "1",
      target,
    });
    return Response.json(reading, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Unable to load air quality", state: code },
      { status: 502 },
    );
  }
}
