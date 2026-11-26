import type { NextRequest } from "next/server";
import { geocodeCities, knownState } from "@/lib/geocode-search";
import { MIN_SEARCH_CHARS } from "@/lib/search-types";
import { cleanText, limited, rateLimit } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  const gate = rateLimit("geocode", request, 60, 60_000);
  if (!gate.ok) return limited(gate.retryAfter);

  const query = cleanText(request.nextUrl.searchParams.get("q"), 60);
  if (query.length < MIN_SEARCH_CHARS) return Response.json({ results: [] });

  const requestedState = (
    request.nextUrl.searchParams.get("state") ?? ""
  ).toUpperCase();
  const stateCode = knownState(requestedState) ? requestedState : null;

  const results = await geocodeCities(query, stateCode, 12);

  return Response.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
