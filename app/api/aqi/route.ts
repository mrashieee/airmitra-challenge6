import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import { resolveAirReading } from "@/lib/air/resolve";
import type { Target } from "@/lib/air/types";

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get("state") ?? "DL").toUpperCase();
  const state = ALL_STATES.find((s) => s.code === code);

  if (!state) {
    return Response.json({ error: "Unknown state code", code }, { status: 400 });
  }

  const city = request.nextUrl.searchParams.get("city") ?? state.capital;
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  const target: Target | undefined =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? { lat, lon, city }
      : undefined;

  try {
    const reading = await resolveAirReading(state, {
      fresh: request.nextUrl.searchParams.get("fresh") === "1",
      target,
    });
    return Response.json(reading, {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      },
    });
  } catch {
    return Response.json(
      { error: "Unable to load air quality", state: code },
      { status: 502 },
    );
  }
}
