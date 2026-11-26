import type { NextRequest } from "next/server";
import {
  searchCities,
  searchOtherStates,
  topCities,
} from "@/lib/city-index";
import { geocodeCities, knownState } from "@/lib/geocode-search";
import { cleanText, limited, rateLimit } from "@/lib/api-guard";
import {
  MIN_SEARCH_CHARS,
  type CitySuggestion,
  type CrossStateSuggestion,
} from "@/lib/search-types";

export async function GET(request: NextRequest) {
  const gate = rateLimit("search", request, 120, 60_000);
  if (!gate.ok) return limited(gate.retryAfter);

  const state =
    cleanText(request.nextUrl.searchParams.get("state"), 4).toUpperCase() ||
    "DL";
  if (!knownState(state)) {
    return Response.json({ error: "Unknown state code", state }, { status: 400 });
  }

  const query = cleanText(request.nextUrl.searchParams.get("q"), 60);
  const limit = Math.min(
    10,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 8) || 8),
  );

  let results: CitySuggestion[] = [];
  let crossState: CrossStateSuggestion[] = [];
  let fallback: "geocode" | null = null;

  if (query.length === 0) {
    results = topCities(state, limit);
  } else if (query.length < MIN_SEARCH_CHARS) {
    results = [];
  } else {
    results = searchCities(state, query, limit);

    if (results.length === 0) {
      // A place in another state is a far more likely explanation than a typo.
      crossState = searchOtherStates(state, query, 3);
    }

    if (results.length === 0 && crossState.length === 0) {
      // Nothing in the index: allow an explicit live lookup so small towns are
      // never a dead end. These are labelled "model only".
      results = await geocodeCities(query, state, limit);
      fallback = results.length ? "geocode" : null;
    }
  }

  return Response.json(
    { results, crossState, fallback },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
