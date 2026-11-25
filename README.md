# AirMitra — Household Air Coach

> **Working title.** Trademark check deferred until after the challenge.

AirMitra tells a household what to do about the air today — for their people, their home, and their routine — and why it matters.

Built for **PromptWars Virtual · Main Challenge 06**.

## Status

Walking skeleton: responsive web + mobile PWA shell with **demo data**. The layout, tabs, and interactions are in place; live CPCB / OpenAQ / CAMS data and Gemini plug in next.

## Run locally

```bash
npm install
cp .env.example .env   # then fill in keys (already present locally)
npm run dev
```

Open http://localhost:3000.

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
```

## Environment

Secrets live in `.env` (gitignored). See `.env.example`.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Gemini, server-side only |
| `DATA_GOV_API_KEY` | CPCB real-time AQI (data.gov.in) |
| `XKDR_API_KEY` | India Air Quality DB |
| `OPENAQ_API_KEY` | Optional fallback |
| `OPEN_METEO_*_BASE_URL` | Forecast + weather, no key |

`NEXT_PUBLIC_*` values are public. Never put a key there.

## Structure

```
app/
  layout.tsx        root layout, metadata, fonts
  page.tsx          renders the app shell
  manifest.ts       PWA manifest
  globals.css       design tokens + motion
components/
  app-shell.tsx     mobile + desktop layouts, nav, state
  home-view.tsx     data-first home: AQI, guideline, family, must-go, do-now
  panels.tsx        Ask, Report, Cards, Settings
  icons.tsx         inline SVG icons
lib/
  aqi.ts            bands, mock reading, advice rules
  states.ts         all 36 states/UTs
  nav.ts            tab types
  ui.ts             band styles + cn
data/
  states.json       28 states + 8 UTs with capitals/coords
```

## Product rules

- **Data-first home.** Live location data + general guidance render even if AI fails.
- **Never restrict without a fallback.** "If you must go out" always follows "stay in".
- **One user, one household.** No accounts, groups, or shared state.
- **Community = share cards**, not a social feature.
- **English default**, with a language switcher for India's most-spoken languages.
- **All 36 states/UTs**, with an honest ground vs model source label.

## Docs

Product and build decisions live one level up:

- `../build-plan.md`
- `../product-brainstorm.md`
- `../plan.md`
- `../india-user-research.md`
- `../hack2skill-research.md`
