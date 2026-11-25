import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import { resolveAirReading } from "@/lib/air/resolve";
import { cacheGet, cacheSet } from "@/lib/air/cache";
import { buildContext, contextJson } from "@/lib/ai/context";
import { generateAnswer } from "@/lib/ai/client";
import { templateAnswer } from "@/lib/ai/fallback";
import { keyFor } from "@/lib/ai/cache-key";
import type { AskResult } from "@/lib/ai/types";
import type { Profile } from "@/lib/profile";

type Body = {
  profile?: Profile;
  state?: string;
  city?: string;
  lat?: number;
  lon?: number;
  question?: string;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (question.length < 2 || question.length > 300) {
    return Response.json(
      { error: "Question must be 2-300 characters" },
      { status: 400 },
    );
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
    const key = keyFor("ask:v2", `${contextString}::${question.toLowerCase()}`);

    const cached = cacheGet<AskResult>(key);
    if (cached) {
      return Response.json(cached, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const ai = await generateAnswer(contextString, question);
    const result: AskResult = ai
      ? {
          answer: ai.answer,
          source: "ai",
          model: ai.model,
          generatedAt: new Date().toISOString(),
        }
      : {
          answer: templateAnswer(question, state, air, profile),
          source: "template",
          model: "rules",
          generatedAt: new Date().toISOString(),
        };

    const ttl = Math.max(
      60,
      Number(process.env.LLM_CACHE_TTL_SECONDS ?? 3600),
    );
    cacheSet(
      key,
      result,
      (result.source === "ai" ? ttl : Math.min(ttl, 300)) * 1000,
    );

    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Unable to answer" },
      { status: 502 },
    );
  }
}
