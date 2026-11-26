import type { NextRequest } from "next/server";
import { searchCities, topCities } from "@/lib/city-index";
import { geocodeCities, knownState } from "@/lib/geocode-search";
import type { CitySuggestion } from "@/lib/search-types";

export async function GET(request: NextRequest) {
  const state = (request.nextUrl.searchParams.get("state") ?? "DL").toUpperCase();
  if (!knownState(state)) {
    return Response.json({ error: "Unknown state code", state }, { status: 400 });
  }

  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    10,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 8) || 8),
  );

  let results: CitySuggestion[];
  let fallback: "geocode" | null = null;

  if (query.length < 2) {
    results = topCities(state, limit);
  } else {
    results = searchCities(state, query, limit);

    if (results.length === 0) {
      // Nothing in the curated index: allow an explicit live lookup so small
      // towns are never a dead end. These are labelled "model only".
      results = await geocodeCities(query, state, limit);
      fallback = results.length ? "geocode" : null;
    }
  }

  return Response.json(
    { results, fallback },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
