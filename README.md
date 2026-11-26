# AirMitra — Household Air Coach

> **Live:** https://airmitra-app.vercel.app  
> **Built for:** PromptWars Virtual · Main Challenge 06 (Urban Air Quality Assistant)

AirMitra tells an Indian household what to do about the air today — for their
people, their home, and their routine — and why it matters. It is a data-first
PWA with a grounded GenAI brief, not a chat-only app.

## What it does

- **Live AQI** from CPCB ground stations, then OpenAQ monitors, then CAMS model
  data. Cities with 2+ official monitors use the **median** and show the range.
- **Where the data comes from** is always visible: station name, distance,
  freshness, and a `ground monitor` / `model estimate` label.
- **City pages** at `/aqi/<state>/<city>` with canonical metadata and a sitemap.
- **Household profile** — you, family, conditions, home inventory, routine.
  Starts with **You**; no invented family members.
- **Grounded GenAI brief and ask** (`gemini-3.1-flash-lite` → lite fallback →
  deterministic templates). The model writes; the data layer decides.
- **Status / story cards** — 1080×1920 PNG with time windows, actions and the
  impact payoff, shareable to WhatsApp, X, Telegram, Facebook, LinkedIn, or
  Instagram (download + caption).
- **Inline settings** — every field editable without the setup wizard.
- **Weather-aware hero** with day/night sun, moon, stars, clouds, rain and fog.
- **PWA** — installable, responsive, reduced-motion aware.

## Data chain

```
CPCB (data.gov.in) ─┐
OpenAQ (<=25 km) ───┼─> median of official stations (<=15 km)
CAMS (Open-Meteo) ──┘        │
                             └─> else CAMS at the city coordinates
```

- AQI uses **CPCB NAQI**, not US AQI. The US equivalent is shown for comparison.
- Stale OpenAQ sensor rows are discarded (freshness window relative to the
  station's newest reading).
- If no monitor is nearby, the page lists the **nearest live monitors** with
  distance and freshness — context, not a fake local reading.

## Architecture

```
app/
  page.tsx                     app shell entry
  aqi/[state]/[city]/page.tsx  public city pages
  api/{aqi,search,geocode,reverse,ask,brief,health}/
components/
  app-shell, home-view, panels, settings-panel, profile-editor,
  location-picker, onboarding, share-cards, weather-scene, aqi-number
lib/
  air/            providers (CPCB, OpenAQ, CAMS, nearby), resolve, cache, NAQI
  ai/             context, prompts, client, templates, cache keys
  city-index.ts   curated + GeoNames city index with monitor tags
  profile*.ts     types, defaults, migrations, server allow-list
  api-guard.ts    body limits, validation, rate limiting
  story-image.ts  canvas story renderer
data/
  states.json, cities.json, city-index.json
scripts/
  build-city-index.mjs         regenerate the city/monitor index
```

## Security & privacy

- **No accounts, no PII, no analytics.** The profile and reports stay in
  `localStorage` and are never uploaded.
- **Secrets are server-side only** (`.env`, gitignored). No secret is exposed to
  the browser.
- **Allow-listed inputs** on AI routes: profile fields are sanitised and capped
  server-side before they enter the prompt; question text is length- and
  control-character-limited.
- **Rate limits** on AI and data routes (per IP, in-memory).
- **CSP and security headers** in production: `default-src 'self'`,
  `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
  HSTS, no `X-Powered-By`.
- **Prompt-injection guardrail:** context and questions are treated as data, not
  instructions.
- **No diagnosis or prescriptions.** If symptoms look urgent, the UI says to see
  a doctor.

## Run locally

```bash
npm install
cp .env.example .env   # add keys (see below)
npm run dev
```

Open http://localhost:3000.

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
npm run index:cities   # rebuild data/city-index.json
```

## Environment

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini, server-side only |
| `GEMINI_MODEL` | Primary model (default `gemini-3.1-flash-lite`) |
| `GEMINI_MODEL_FALLBACK` | Fallback lite model |
| `DATA_GOV_API_KEY` | CPCB real-time AQI (data.gov.in) |
| `OPENAQ_API_KEY` | OpenAQ ground fallback |
| `OPEN_METEO_*` | CAMS + weather endpoints (no key) |
| `AQI_CACHE_TTL_SECONDS` | Air cache TTL (default 900) |
| `LLM_CACHE_TTL_SECONDS` | AI response cache TTL |

## Known limitations

- `data.gov.in` is unreachable from Vercel's network, so production uses
  OpenAQ → CAMS. CPCB remains first when reachable.
- Some towns have no continuous monitor; they show CAMS model data and nearby
  monitor context.
- Manual NAMP samples are not used live (they can be months old).
- English UI; the language selector is a saved preference.

## Data credits

CPCB / data.gov.in, OpenAQ, Open-Meteo (CAMS), GeoNames (CC BY 4.0), and
OpenStreetMap/Photon for geocoding.
