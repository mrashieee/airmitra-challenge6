import type { NextRequest } from "next/server";
import { ALL_STATES } from "@/lib/states";
import {
  cleanText,
  indiaCoords,
  limited,
  rateLimit,
  readJson,
} from "@/lib/api-guard";
import { sanitizeProfile } from "@/lib/profile-sanitize";
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
  const gate = rateLimit("ask", request, 20, 60_000);
  if (!gate.ok) return limited(gate.retryAfter);

  const parsed = await readJson<Body>(request);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const question = cleanText(body.question, 300);
  if (question.length < 2) {
    return Response.json(
      { error: "Question must be 2-300 characters" },
      { status: 400 },
    );
  }

  const code = cleanText(body.state, 4).toUpperCase() || "DL";
  const state = ALL_STATES.find((s) => s.code === code);
  if (!state) {
    return Response.json({ error: "Unknown state" }, { status: 400 });
  }

  const profile = sanitizeProfile(body.profile);
  if (!profile) {
    return Response.json({ error: "Missing profile" }, { status: 400 });
  }

  const city = cleanText(body.city, 80) || state.capital;
  const coords = indiaCoords(body.lat, body.lon);
  if (body.lat !== undefined && body.lon !== undefined && !coords) {
    return Response.json({ error: "Invalid coordinates" }, { status: 400 });
  }
  const target = coords ? { ...coords, city } : undefined;

  try {
    const air = await resolveAirReading(state, { target });
    const context = buildContext(state, air, profile);
    const contextString = contextJson(context);
    const key = keyFor("ask:v3", `${profile.language}::${contextString}::${question.toLowerCase()}`);

    const cached = cacheGet<AskResult>(key);
    if (cached) {
      return Response.json(cached, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const ai = await generateAnswer(contextString, question, profile.language);
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
