import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import { resolveAirReading } from "@/lib/air/resolve";
import { cacheGet, cacheSet } from "@/lib/air/cache";
import { buildContext, contextJson } from "@/lib/ai/context";
import { generateBrief } from "@/lib/ai/client";
import { templateBrief } from "@/lib/ai/fallback";
import { keyFor } from "@/lib/ai/cache-key";
import type { Brief } from "@/lib/ai/types";
import type { Profile } from "@/lib/profile";

type Body = {
  profile?: Profile;
  state?: string;
  city?: string;
  lat?: number;
  lon?: number;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = (body.state ?? "DL").toUpperCase();
  const state = ALL_STATES.find((s) => s.code === code);
  if (!state) {
    return Response.json({ error: "Unknown state" }, { status: 400 });
  }

  const profile = body.profile;
  if (
    !profile ||
    !Array.isArray(profile.family) ||
    !profile.home ||
    !profile.routine
  ) {
    return Response.json({ error: "Missing profile" }, { status: 400 });
  }

  const city = body.city ?? state.capital;
  const target =
    typeof body.lat === "number" &&
    Number.isFinite(body.lat) &&
    typeof body.lon === "number" &&
    Number.isFinite(body.lon)
      ? { lat: body.lat, lon: body.lon, city }
      : undefined;

  try {
    const air = await resolveAirReading(state, { target });
    const context = buildContext(state, air, profile);
    const contextString = contextJson(context);
    const key = keyFor("brief:v2", contextString);

    const cached = cacheGet<Brief>(key);
    if (cached) {
      return Response.json(cached, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const ai = await generateBrief(contextString);
    const brief: Brief = ai
      ? {
          ...ai.brief,
          source: "ai",
          model: ai.model,
          city,
          generatedAt: new Date().toISOString(),
        }
      : templateBrief(state, air, profile);

    const ttl = Math.max(
      60,
      Number(process.env.LLM_CACHE_TTL_SECONDS ?? 3600),
    );
    cacheSet(key, brief, (brief.source === "ai" ? ttl : Math.min(ttl, 300)) * 1000);

    return Response.json(brief, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Unable to build brief" },
      { status: 502 },
    );
  }
}
