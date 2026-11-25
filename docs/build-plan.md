# Build Plan - Challenge 06 (LOCKED)

_Decisions frozen 20 Nov 2026. Deadline: 29 Nov 2026. Solo, any tools allowed._

---

## 0. Current status (21 Nov)

**Done:** scaffold, mobile + desktop UI shell, PWA, smoke tests, live **city-aware** data layer, onboarding + profile, **GenAI brief + ask with model fallback and rule-based safety net**.

**Not done:** full rules engine (advice ledger, time triggers), deploy, submission assets.

**Next three, in order — do not reorder:**
1. Rules engine — advice ledger + time triggers + routine-aware advice.
2. Deploy + submission assets.
3. Dark mode / travel only if buffer remains.

**Rule:** no more design exploration until those three work end to end. Design polish is Day 6.

---

## 1. Locked decisions

| Decision | Locked value |
|---|---|
| Product | **AirMitra** — Household Air Coach (working title; trademark check deferred) |
| Product type | Personal household air coach (not a dashboard, not a chatbot-only app) |
| Clients | **One Next.js codebase → responsive website (PC/laptop) + installable mobile PWA.** Optional Capacitor APK later. No native rewrite. |
| User | One person caring for themselves + family members |
| Community | Share cards only - no accounts, groups, codes, or boards |
| Home screen | Data-first: location + AQI + pollutants + weather + source + general guideline; GenAI on top |
| Safety rule | Never restrict without an "if you must" fallback (applies to general + personal advice) |
| Tools | Any tools allowed; Antigravity/Gemini optional |
| GenAI | Gemini server-side; rules decide, LLM phrases, calculator owns numbers |
| Language | English default; switcher with 12 most-spoken Indian languages (6 reviewed, 6 beta) |
| Coverage | All 28 states + 8 UTs (36), nearest station + model fallback |
| Tone | Calm coach, non-judgmental, no moralising |
| Proactivity | Smart/silent: max 3 nudges/day, event-driven, advice ledger |
| Smart home | Stretch only; no hardware in the demo |
| Demo | 5-minute scripted scenario, no live exploration |

---

## 2. Final scope

### Ship (MVP)
1. 6-screen chip onboarding (family + home + routine + health + language)
2. Data-first home (36 states/UTs, trust bar, general guideline, personalised directive, if-you-must, do-now)
3. GenAI: morning brief + ask + why (grounded, guardrailed)
4. Impact receipts (health / emissions / money)
5. India adaptations: indoor sources, no-purifier clean room, mask fit, filter cost
6. Low-emission routines + sustainable swaps
7. Symptom check-in + local issue report
8. Share cards (air advisory, improve-air, swaps, travel kit)
9. Travel mode (forecast + kit only)
10. **Two clients, one codebase:** responsive desktop website (PC/laptop) + installable mobile PWA
11. PWA, English default + language switcher, large text

### Explicitly cut
- Accounts, groups, codes, shared boards, leaderboards
- Smart home control (stretch)
- Voice read-aloud (stretch)
- Indoor AQI estimation (stretch)
- City rankings, heatmaps, complex charts
- Native app, Play Store
- Separate mobile and web codebases
- Vendor cloud APIs (Airveda/IQAir/Airthings) and direct Matter - stretch
- **Indoor monitor (stretch):** setup state, manual entry, Home Assistant connector, virtual sensor
- Route optimisation

### Definition of done
- Live URL works in a desktop browser **and** installs as a PWA on a phone
- One codebase, two layouts - no duplicated logic
- All 36 states return a value with a source badge
- No screen is blank if the LLM or an API fails
- 5-minute demo runs without a crash
- Blog + LinkedIn post published

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + Tailwind, **one responsive codebase** | Desktop website + mobile PWA from the same components |
| Mobile client | PWA (installable) | No Play Store; works on any Android |
| Desktop client | Same app, wide layout | Sidebar + multi-column, keyboard-friendly |
| Optional APK | Capacitor wrap (stretch) | Only if time; not required for demo |
| Hosting | Vercel (Mumbai/edge) | Free, simple deploys |
| Data | CPCB (data.gov.in) → XKDR → OpenAQ → Open-Meteo CAMS | Live ground truth, then fallback |
| GenAI | Gemini (server-side route) | Free tier, good multilingual |
| Storage | IndexedDB (client) + no DB for MVP | Privacy + speed |
| i18n | JSON locale files + LLM output in chosen language | Static UI, dynamic advice |
| Charts | Minimal sparkline only | Decision first |

---

## 4. Architecture

```
PWA (phone)
  │ small JSON context
  ▼
Next.js API routes (serverless)
  │ 1. rules engine (thresholds, advice keys, ledger)
  │ 2. Gemini call (grounded prompt)
  │ 3. guardrail + impact calculator
  ▼
Response → render → cache (IndexedDB)
```

Failure rules:
- API down → cached value + "updated X ago"
- LLM down → rules-generated guideline, no personal prose
- No network → last-known + offline banner

At scale (say it in the blog, don't build it):
- One ingestion job per station → Postgres/Redis → CDN.
- Precompute briefs per area × archetype; LLM only for chat.

---

## 5. Screens

1. **Home** - location, AQI, pollutants, weather, trust bar, general guideline, family notes, if-you-must, do-now, actions (Ask / Report / Share / Plan)
2. **Setup** - 6 chip screens, resumable
3. **Ask** - chat with context; suggested questions
4. **Report** - symptoms (chips) + local issue (chips + photo/pin)
5. **Cards** - preview + share
6. **Travel** - destination + dates → forecast + kit
7. **Settings** - language, text size, notifications, clear data

### Responsive layouts (same components)

**Mobile PWA - single column**
- Sticky top: location + AQI + trust bar
- Content: general guideline → family notes → if-you-must → do-now
- Bottom tab bar: Today · Ask · Report · Cards · Settings
- Large tap targets, thumb-friendly actions, install prompt

**Desktop website - multi-column**
- Left sidebar: location switcher, saved places, sections
- Center: live data + pollutants + 24h sparkline + map
- Right rail: guidance, family notes, Ask panel
- Top bar: language, text size, share
- Keyboard: `/` focus ask, `L` change location, `S` share

**Shared**: same API routes, same rules engine, same copy, same i18n. Only the layout shell differs (`useMediaQuery` / CSS grid).

---

## 6. Data contracts

```ts
// GET /api/aqi?state=DL&city=New Delhi
{
  location: { state, city, area },
  station: { name, distanceKm, sourceType: "ground" | "model" },
  updatedAt: string,
  aqi: number,
  category: "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe",
  pollutants: { pm25, pm10, no2, so2, o3, co },
  weather: { tempC, windKph, rain },
  hourly: [{ t, aqi }]
}

// POST /api/brief
{ profile, home, routine, fingerprint, language }

// POST /api/ask
{ question, profile, home, aqiContext, language }

// POST /api/report
{ type: "symptom" | "local", flags, note?, location? }
```

---

## 7. Advice engine

**State fingerprint**
```
hash(aqiBand + dominantPollutant + 6hTrend + weather + timeOfDay + profileVersion)
```

**Advice ledger**
- Key: `(adviceType, area, riskBand, day)`
- Suppress same key for 24h
- Escalation may re-fire, reframed
- "Don't tell me again" disables permanently

**Budget**
- Max 1 nudge / 3h, 3/day
- Morning brief + evening wrap
- Everything else in-app

**Thresholds (verify before publishing)**
| Profile | Stricter at |
|---|---|
| Kids 0-5 | AQI > 100 |
| Asthma / COPD | AQI > 100-150 |
| Elderly | AQI > 150 |
| Pregnant | AQI > 100 |
| Default adult | AQI > 150 |

**Directive states**
| Band | Directive | If you must |
|---|---|---|
| Severe / Very Poor | Don't go out until X | N95, avoid main roads, <15 min, inhaler |
| Poor / Moderate | Limit outdoor time | N95 for sensitive, short trips |
| Satisfactory / Good | Good window - go out | No mask needed |

---

## 8. Impact formulas (estimates - show ranges, cite in blog)

> All values are approximate and must be reviewed. The app shows ranges, never false precision.

| Claim | Range | Basis |
|---|---|---|
| N95 dose reduction | 80-95% | NIOSH filtration + real-world fit studies |
| Clean room PM2.5 reduction | 40-70% | HEPA + closed-room studies |
| Purifier room reduction | 50-80% | HEPA CADR vs room volume |
| Incense/coil PM spike | 3-5x | Indoor combustion studies |
| Car CO2 | ~120-150 g/km | Transport emission factors |
| Metro CO2 | ~20-40 g/passenger-km | Transit emission factors |
| Purifier filter cost | ~₹1.5-2.5k / 3 months | User reports; make configurable |

Rules:
- Calculator produces the number; LLM only phrases it.
- Show "~" and a range.
- Cite source in the "why" sheet.

---

## 9. Day-by-day

### Day 0 - accounts + design (done)

**Accounts to create (30-45 min)**
| Service | What you need | Notes |
|---|---|---|
| Hack2Skill dashboard | Confirm Challenge 06 + submission fields | Screenshot the requirements |
| data.gov.in | Register → request **CPCB real-time AQI** API key | Use DigiLocker/email; key appears under My Account |
| OpenAQ | Register → API key | Fallback ground data |
| Google AI Studio | Gemini API key | Server-side only, never in client |
| GitHub | Repo | Private until submission |
| Vercel | Connect GitHub | Deploy from day 1 |
| OpenWeather (optional) | API key | Only if CAMS/forecast gaps |

Store keys in `.env`; never commit. Add `.env*` to `.gitignore`.

**Gemini API setup (Google AI Studio)**
1. Go to **https://aistudio.google.com** and sign in with a personal Google account.
2. Accept the terms.
3. Click **Get API key** (left nav: *API Keys*).
4. Create or select a Google Cloud project, then **Create API key**.
5. Copy the key into `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.5-flash   # pick the current Flash model from the list
   ```
6. Test it server-side:
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/models/$GEMINI_MODEL:generateContent?key=$GEMINI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Say OK"}]}]}'
   ```
7. Keep the key **server-side only** (API route / server action). Never expose it in the client bundle.
8. Set a billing alert if you enable billing; free tier has per-minute/per-day limits.

If you get `API key not valid`, enable the **Generative Language API** for that project in Google Cloud Console. If you get `429`, you hit the free-tier rate limit — add retry/backoff and cache.

**Frontend design - timebox 3 hours, not 3 days**
- Pick **3 references only** (e.g., IQAir for data density, Apple Weather for motion, Linear/Notion for calm UI). Do not browse endlessly.
- Score them 1-5 on: glanceability, trust, thumb use, motion restraint, accessibility.
- Then lock: type scale, spacing (4/8), AQI colours (never colour-only), radius, motion durations.
- Build **one static home screen** on phone + laptop with fake data. Design is not blocked by API keys.

**Motion rules (for smooth + high-fidelity)**
- 150-250 ms, ease-out; spring only for direct manipulation.
- Skeleton loading, not spinners.
- Shared-element transition for card → detail.
- Respect `prefers-reduced-motion`.
- No parallax, no decorative loops, no layout shift.
- Budget: <1 MB initial JS, Lighthouse 90+, LCP <2.5 s.

**Walking skeleton before styling**
- Fake data → home screen → phone layout + desktop layout → deploy.
- Then connect real APIs. Then style. Never style before the data flows.

---

| Day | Date | Work |
|---|---|---|
| 0 | 20 Nov | ~~Scaffold + UI shell~~ **done.** ~~`/api/aqi` (CPCB → CAMS), replace mock~~ **done 21 Nov** |
| 1 | 21 Nov | ~~6-screen onboarding + local profile~~ **done.** City-level location + auto-location + **city search in setup and header** + **multi-select cooking/cooling with exclusive None** + profile-driven advice |
| 2 | 22 Nov | Rules engine: thresholds, directives, ledger, home-specific advice |
| 3 | 23 Nov | ~~GenAI `/api/brief`~~ **done.** Grounded prompt, model fallback, cache, template fallback |
| 4 | 24 Nov | ~~GenAI `/api/ask` + guardrails~~ **done 23 Nov.** Real answers, rule fallback |
| 5 | 25 Nov | Travel mode + share card content; wire symptom/local report |
| 6 | 26 Nov | Polish + India adaptations; language switcher behaviour |
| 7 | 27 Nov | Deploy to Vercel; PWA install QA on phone + laptop; rehearse demo |
| 8 | 28 Nov | Blog + LinkedIn + optional reel; final QA |
| 9 | 29 Nov | Submit early (do not wait till night) |

Buffer rule: if Day 6 slips, cut travel mode first, then local issue reports. Never cut the home screen, GenAI ask, or share card.

---

## 10. Demo script (5 minutes)

Scene: **Delhi, 7am, AQI 312. Family: father (asthma), daughter (6). Home: no purifier, gas stove, agarbatti.**

1. **Open on laptop** → wide layout: data + map + guidance at a glance. Then **open the same URL on phone** → install prompt → same data, mobile layout.
2. **Personal** → "For your father: no walk before 11. If he must: N95 + inhaler."
3. **Ask** → "Can my father walk at 6am?" → answer + why.
4. **Home** → no-purifier clean room + expected reduction; swap agarbatti timing.
5. **Report** → "cough" check-in → advice tightens; red-flag demo optional.
6. **Impact** → "N95 on the school run cuts her dose ~85%."
7. **Share** → card preview → send to WhatsApp.
8. **Tomorrow** → "improves after 11; plan the walk then."
9. **Close** → "No accounts. No groups. Works on a ₹8k phone."

---

## 11. Submission checklist

- [ ] Live URL working on phone
- [ ] Code repo cleaned + README
- [ ] Technical blog (architecture, prompts, trade-offs, scale note)
- [ ] LinkedIn build-in-public post
- [ ] Optional Instagram reel (bonus credits)
- [ ] Both parts submitted on Hack2Skill by 29 Nov
- [ ] Credits expire 1 Jan 2027 noted

---

## 12. Remaining risks

| Risk | Mitigation |
|---|---|
| Time (9 days) | Freeze scope; cut travel/report first |
| Impact numbers challenged | Ranges + sources + "estimate" label |
| GenAI hallucination | Rules + calculator own facts; LLM phrases only |
| AQI distrust | Source + station + distance + freshness |
| Small states no station | CAMS fallback + honest badge |
| Medical safety | No diagnosis; red flags → doctor; disclaimer |
| Demo failure | Pre-cache the demo scenario; offline fallback works |

---

## 13. Open items to close today

1. **Create API keys:** data.gov.in (CPCB), OpenAQ, Google AI Studio (Gemini).
2. **Confirm Gemini model** available on free tier.
3. **Pick the demo city/area** (Delhi - Anand Vihar or similar with good station coverage).
4. **Confirm 6 reviewed languages** (English + Hindi, Bengali, Marathi, Telugu, Tamil).
