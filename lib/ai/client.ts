import type { Brief } from "./types";

type AiBrief = Omit<Brief, "source" | "city" | "generatedAt">;

const BRIEF_SYSTEM = `You are AirMitra, a calm household air coach for India.

Rules:
- Use ONLY the numbers in CONTEXT. Never invent a number.
- Do NOT quote pollutant concentrations (µg/m³ or mg/m³). Use AQI and band only.
- Never diagnose, prescribe, or give medication doses.
- Always include a practical "if you must go out" fallback.
- Never moralize about crackers, incense, or farming.
- Write for a family, not a generic user.
- If the family list is empty, give general household advice and suggest adding family members.
- If someone is severe, be stricter.
- Prefer actions the household can actually do today.
- Use explicit clock windows from CONTEXT (e.g. "6–9 AM", "11 AM–4 PM"). Never say "this hour" or leave time vague.

Return JSON only with this exact shape:
{"directive":"...","why":"...","mustGoOut":"...","doNow":["...","...","..."]}

Limits: directive <= 14 words; why <= 25 words; mustGoOut <= 25 words; each doNow <= 12 words.`;

const ASK_SYSTEM = `You are AirMitra, a calm household air coach for India.

Rules:
- Use ONLY the numbers in CONTEXT. Never invent a number.
- Do NOT quote pollutant concentrations (µg/m³ or mg/m³). Use AQI and band only.
- Never diagnose, prescribe, or give medication doses.
- If this is a medical emergency, tell them to see a doctor now.
- Answer in plain text, max 70 words.
- Do NOT return JSON. Do not use markdown.
- Be specific to the person, room, or time they asked about.
- Use explicit clock windows (e.g. "6–9 AM"), never "this hour".
- If they ask about going out, include what to do if they must.`;

function models(): string[] {
  const list = [
    process.env.GEMINI_MODEL,
    process.env.GEMINI_MODEL_FALLBACK,
    "gemini-3.8-flash",
  ].filter((value): value is string => Boolean(value));

  return [...new Set(list)];
}

async function callModel(
  model: string,
  prompt: string,
  system: string,
  maxTokens = 360,
): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: maxTokens,
          },
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function clip(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trim()}…` : clean;
}

function parseBrief(text: string): AiBrief | null {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as {
      directive?: unknown;
      why?: unknown;
      mustGoOut?: unknown;
      doNow?: unknown;
    };

    if (
      typeof parsed.directive !== "string" ||
      typeof parsed.why !== "string" ||
      typeof parsed.mustGoOut !== "string" ||
      !Array.isArray(parsed.doNow)
    ) {
      return null;
    }

    const doNow = parsed.doNow
      .filter((item): item is string => typeof item === "string")
      .map((item) => clip(item, 80))
      .slice(0, 3);

    if (doNow.length < 1) return null;

    return {
      directive: clip(parsed.directive, 140),
      why: clip(parsed.why, 200),
      mustGoOut: clip(parsed.mustGoOut, 200),
      doNow,
    };
  } catch {
    return null;
  }
}

export async function generateBrief(
  context: string,
): Promise<{ brief: AiBrief; model: string } | null> {
  const prompt = `CONTEXT:
${context}

Write today's brief for this household.`;

  for (const model of models()) {
    const text = await callModel(model, prompt, BRIEF_SYSTEM);
    if (!text) continue;
    const brief = parseBrief(text);
    if (brief) return { brief, model };
  }

  return null;
}

export async function generateAnswer(
  context: string,
  question: string,
): Promise<{ answer: string; model: string } | null> {
  const prompt = `CONTEXT:
${context}

QUESTION:
${question}

Answer in <= 70 words. Use only the context numbers. If this is a medical emergency, tell them to see a doctor now. No markdown.`;

  for (const model of models()) {
    const text = await callModel(model, prompt, ASK_SYSTEM, 220);
    if (!text) continue;
    return { answer: clip(text.replace(/[*#]/g, ""), 600), model };
  }

  return null;
}
