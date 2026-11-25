export async function GET() {
  return Response.json({
    ok: true,
    hasDataGovKey: Boolean(process.env.DATA_GOV_API_KEY),
    hasOpenAQKey: Boolean(process.env.OPENAQ_API_KEY),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    geminiModel: process.env.GEMINI_MODEL ?? null,
    geminiFallback: process.env.GEMINI_MODEL_FALLBACK ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
