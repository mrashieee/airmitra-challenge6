import type { NextRequest } from "next/server";
import { geocodeCities, knownState } from "@/lib/geocode-search";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (query.length < 2) return Response.json({ results: [] });

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
