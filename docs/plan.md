# Challenge 6 – Plan

## 1. Overview
- Product name: **AirMitra** — Household Air Coach (working title)
- Challenge name: PromptWars Virtual - Main Challenge 06: Urban Air Quality Assistant
- Platform: Hack2Skill x Google for Developers (PromptWars Virtual, individual only)
- Goal: GenAI app helping a person care for their family through severe winter smog - personalised low-emission routines, indoor air quality hacks, sustainable swaps, with a visible impact + "why" behind every choice.
- Team: Muhammad Rashid K (Solo)
- Timeline: Challenge live now · **Submission deadline: 29 Nov 2026** (Dual submission: code + live preview + blog + LinkedIn post)
- Tools: **Any tools allowed** (organizers confirmed) - Antigravity/Gemini optional, use what ships fastest
- Coverage: **All 28 states + 8 UTs of India**, including small states/UTs (Goa, Sikkim, Tripura, Manipur, Mizoram, Nagaland, Meghalaya, Arunachal, Uttarakhand, Himachal, J&K, Ladakh, A&N, Lakshadweep, Puducherry, Chandigarh, DNH&DD)

## 2. Problem Understanding (official brief)
> "Create a **GenAI-powered assistant** that helps **families and communities** navigate severe winter smog and urban air pollution. The application should suggest **low-emission daily routines**, **indoor air quality hacks**, and **sustainable alternatives** tailored to their location and lifestyle, while **clearly explaining the direct impact of their choices**."

- Problem statement summary: Winter-smog decision support for a person and the family members they look after - not "what is the AQI" but "what should we do today, what impact will it have, and why". Community reach = shareable advice cards, not a shared app.
- Input: Location, nearest station (not city average), real-time/historical AQI (CPCB, XKDR, OpenAQ, OpenWeather), weather, household members (kids/elderly/asthma/pregnancy), **home inventory** (type, cooking fuel, windows, cooling, purifier, indoor smoke, **agarbatti/coil/karpooram/havan**, sweeping, pets, plants, carpet, dampness), daily routine
- Output: **Website client (PC/laptop) + mobile client (installable PWA) from one Next.js codebase**, with: **state/UT selector covering all 36 (28 states + 8 UTs)**, **data-first home (location, AQI + pollutant values, weather, source + freshness, general guideline)**, personalized directive, pollutant breakdown, 24-48h forecast/trend, **GenAI ask + daily brief**, **user-reported symptom check-in + local issue report**, **low-emission routine**, indoor air hacks, **sustainable swaps**, **impact receipts (health / emissions / money)**, **shareable advice cards (air advisory, improve-air, swaps, travel kit)**, travel mode + [Exploratory] smart-home actions
- Constraints: Solo dev, ~9 days, any tools allowed, free APIs, mobile-responsive, all-states coverage mandatory, GenAI must be central, **single-user app (no accounts/groups/codes)**, IoT is stretch
- Evaluation metric (published): solution quality, prompt/architectural elegance, demo clarity; valid dual submission required
- **Brief-driven must-haves:** (1) GenAI generates advice, not templates; (2) communities reached by forwarding a card, not by a group feature; (3) low-emission + sustainable + visible impact.

## 3. Approach
- [ ] Phase 0 (Day 1): Register/confirm dashboard, watch Challenge 06 explainer, lock household + home inventory + impact UX
- [ ] Phase 1 (Day 2-3): **National coverage layer** - all 36 states/UTs with coords, data fallback chain so every one returns a value
- [ ] Phase 2 (Day 3-5): Core app - **data-first home** (location + AQI + pollutants + weather + source/freshness + general guideline), map, 6-screen chip onboarding (family members + home inventory), **GenAI ask/brief** on top, recommendation engine
- [ ] Phase 3 (Day 5-6): **Impact receipts + low-emission routines + sustainable swaps**; **symptom check-in + local issue report**; phone PWA; forecast
- [ ] Phase 4 (Day 6-7): **Shareable advice cards** (air advisory, improve-air, swaps, travel kit); [stretch] smart-home mock
- [ ] Phase 5 (Day 8): Deploy live link, polish UI, record demo
- [ ] Phase 6 (Day 9): **Dual submission** - code + live preview + technical blog + LinkedIn build-in-public post (+ optional Instagram reel)
- Note: IoT features not final - decide after core plan works.

## 3b. All-India Coverage Strategy (28 states + 8 UTs)
- **Problem:** CPCB ground stations are concentrated in big cities; small states/UTs (Lakshadweep, A&N, Ladakh, Mizoram, Nagaland, Arunachal, Sikkim, DNH&DD) have little or no live station.
- **Solution:** 3-level fallback so the selector never shows "no data":
  1. **CPCB station** in that state/UT (if available)
  2. **OpenAQ/ XKDR** nearest station
  3. **Open-Meteo CAMS model** at the state capital coordinates (works everywhere, free, no key)
- Bundle a static `states.json` (36 entries: name, type, capital, lat, lon, region) and ship it with the app.
- Show a **data source badge** per state: `Ground station` vs `Satellite/model estimate` so accuracy is honest.
- Full checklist + coordinates: see `india-states-coverage.md`.

## 3c. India Reality Check (from Reddit/Facebook research)

Full research: `india-user-research.md`. Key changes:

1. **Trust beats accuracy claims.** Users compare apps and see different numbers; many apps use satellite models. Always show **source + station name/distance + last updated + range**, and label model estimates.
2. **Decision first, number second.** Users ask "can I go out?" not "what is AQI?". Home screen leads with the directive.
3. **Indoor sources matter.** Agarbatti/karpooram/mosquito coil can push indoor PM2.5 from ~80 to ~500. Add them to onboarding + swaps.
4. **Most households don't own a purifier** (filters cost ~₹2.2k/3 months). Always ship a **no-purifier clean-room path**; never make buying one the primary advice.
5. **Masks are a fit problem.** Cloth/surgical are common but ineffective; N95 discomfort is real. Give fit check + when-it-matters + reuse rules.
6. **Do not moralize** about crackers, incense, or farmers. Offer timing-based alternatives and respect the practice.
7. **Language/accessibility.** English is the default; a visible switcher offers India's 12 most-spoken languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese). Icon-first, large text, read-aloud. Ship 6 reviewed translations, mark the rest beta; GenAI writes advice in the chosen language.
8. **Hyperlocal.** Air varies 100-200% within an hour; nearest station, not city average.
9. **WhatsApp is the distribution.** Share cards must read well as a WhatsApp image (large text, place + time + actions).

Cheap India-specific features to add:
- Peak-window guidance ("close windows 6pm-11am")
- Indoor source checklist (one-time taps)
- No-purifier clean room (step-by-step)
- Mask fit in 20 seconds
- Filter-cost calculator
- Power-cut note (purifier needs power)
- Festival mode (Diwali, no shaming)
- Winter smog mode (stubble + inversion + school closures)
- "For my parents" quick switch

## 4. Tech Stack
- Builder: **Any tools allowed** (organizers confirmed). Recommended: Antigravity + Gemini for speed, but plain coding is fine.
- Frontend (Website + Mobile): **Next.js / React + Tailwind, one responsive codebase** - desktop multi-column layout + mobile single-column PWA
- Mobile client: installable PWA (no Play Store); optional Capacitor APK later
- Desktop client: same app in a wide layout (sidebar + center data + right guidance)
- Backend/API: CPCB (data.gov.in) for India live + XKDR for history, OpenAQ v3 fallback, Open-Meteo CAMS model fallback for **all 36 states/UTs**; Next.js API routes or FastAPI
- Map/Charts: Leaflet + Plotly/Recharts
- AI (central): **Gemini / Google AI Studio** generates daily brief, chat answers, and "why" - grounded on API numbers + user context, with template fallback if the model fails
- Impact calculator (deterministic): PM2.5 dose reduction, CO2 saved, cost saved - LLM only phrases it, never invents numbers
- Share: one-tap advice cards (air advisory, improve-air, swaps, travel kit) exported to any chat - no accounts/groups
- Smart Home (Exploratory): Google Home Smart Home API / Alexa Skills Kit / IFTTT Webhooks / MQTT mock for air purifier demo
- Tools: Git, Antigravity, Vercel/Cloud Run, Hack2Skill portal, blog platform (Hashnode/Medium)

## 5. Tasks
| Task | Owner | Status | Deadline |
|------|-------|--------|----------|
| Confirm registration + read dashboard brief | Muhammad Rashid K | Todo | 21 Nov |
| Build `states.json` - all 28 states + 8 UTs w/ coords | Muhammad Rashid K | Todo | 21 Nov |
| Verify data fallback works for every state/UT | Muhammad Rashid K | Todo | 22 Nov |
| Understand problem + select API | Muhammad Rashid K | Todo | 21 Nov |
| Register keys: CPCB data.gov.in, XKDR, OpenAQ, (OpenWeather) | Muhammad Rashid K | Todo | 21 Nov |
| Setup repo - Next.js PWA with mobile + desktop layout shells | Muhammad Rashid K | Todo | 22 Nov |
| Build data-first home (location, AQI, pollutants, weather, general guideline) + map | Muhammad Rashid K | Todo | 24 Nov |
| India adaptations: indoor source checklist, no-purifier path, mask fit, filter cost | Muhammad Rashid K | Todo | 25 Nov |
| GenAI brief + chat (grounded) | Muhammad Rashid K | Todo | 25 Nov |
| Impact receipts + low-emission routines + sustainable swaps | Muhammad Rashid K | Todo | 26 Nov |
| User-reported issues: symptom check-in + local report | Muhammad Rashid K | Todo | 25 Nov |
| Shareable advice cards (air advisory + improve-air + swaps + travel kit) | Muhammad Rashid K | Todo | 26 Nov |
| Add forecast + GenAI "why" assistant + phone installable | Muhammad Rashid K | Todo | 26 Nov |
| [Stretch-TBD] Smart-home spike: Google Home/Alexa -> purifier mock | Muhammad Rashid K | Todo | 26 Nov |
| Deploy live preview | Muhammad Rashid K | Todo | 27 Nov |
| Technical blog (build-in-public) | Muhammad Rashid K | Todo | 28 Nov |
| LinkedIn post + optional Instagram reel (bonus credits) | Muhammad Rashid K | Todo | 28 Nov |
| Final dual submission on portal | Muhammad Rashid K | Todo | **29 Nov** |

## 6. Resources - Pollution Data Sources (researched)

Priority order: **India -> Asia -> World**. Use a layered strategy: ground-station data for "now", model data for forecasts.

### 6a. India (primary)
| Source | What you get | Cost / Limits | Key |
|--------|--------------|---------------|-----|
| **CPCB via data.gov.in** (official) | Real-time hourly AQI from CPCB stations, NAQI scale, station lat/lon, pollutant min/max/avg | Free, API key from data.gov.in | Yes |
| **XKDR India Air Quality DB** (airquality.xkdr.org) | Cleaned hourly data since 2009, 558 stations, 15 pollutants, Parquet + query API | Free key in ~1 min; demo key available | Yes |
| **SAFAR (IITM)** | City forecasts for Delhi/Mumbai/Pune/Ahmedabad | Mostly portal/scrape, no clean public API | No |
| **OpenAQ v3** | CPCB + US Embassy ground stations, harmonized | Free key, rate limited. **Optional** - skip if signup fails; CPCB + CAMS cover India | Yes |

**Best India pick: CPCB (data.gov.in) for live + XKDR for history; OpenAQ as fallback.**

### 6b. Asia (secondary)
| Source | Notes | Cost |
|--------|-------|------|
| **OpenAQ v3** | Best open aggregator across Asia (India, Japan, Korea, SEA) | Free key |
| **WAQI / AQICN** | 10,000+ stations, map tiles, city + geo feeds | Free key; **non-commercial only**, no caching/redistribution |
| **Open-Meteo (CAMS)** | CAMS Europe + global model, hourly, 5-day forecast | Free, **no key**, non-commercial |
| **Google Air Quality API** | 500m resolution, 96h forecast, heatmaps, 70+ AQIs incl `ind_cpcb`, 100+ countries | Paid, 10k free calls/month, $5 per 1k |

### 6c. World (global fallback)
| Source | Notes | Cost |
|--------|-------|------|
| **Open-Meteo Air Quality API** | CAMS global 0.4° (~45km), 3-hourly, 5-day forecast, no key | Free (non-commercial) |
| **OpenAQ v3** | Global ground truth, 100+ countries | Free key |
| **OpenWeather Air Pollution API** | Current + 4-day hourly forecast + history from Nov 2020, AQI + CO/NO/NO2/O3/SO2/NH3/PM2.5/PM10 | Free: 60/min, 1M/month |
| **Google Air Quality API** | Most accurate/visual (500m heatmap tiles, health recommendations) | Paid tier |
| **IQAir** | 30k sensors, city/station, 72h forecast | Free: 5/min, 500/day, 10k/month (non-commercial) |

### 6d. Recommended Stack (practical for solo build)
1. **Live AQI (India):** CPCB data.gov.in -> normalize to CPCB NAQI
2. **History/training:** XKDR Parquet (India) / OpenAQ v3 (Asia+World)
3. **Forecast:** Open-Meteo CAMS (free, no key) or OpenWeather (4-day hourly)
4. **Maps/heatmap (optional wow-factor):** Google Air Quality API free tier (10k calls/mo) or WAQI tiles
5. **Fallback chain:** CPCB -> OpenAQ -> OpenWeather -> cached last-known

> **Important:** AQI scales are NOT interchangeable. India uses CPCB **NAQI** (Good, Satisfactory, Moderate, Poor, Very Poor, Severe). Most global APIs return **US EPA AQI**. Build one normalization layer + keep the source label visible.

### 6e. Licensing notes
- WAQI/AQICN: non-commercial, no cached redistribution -> fine for hackathon demo, flag in README.
- OpenAQ: free, attribution required.
- CAMS/Open-Meteo: non-commercial, attribution ("Contains modified Copernicus data").
- CPCB/data.gov.in: Government Open Data Licence (GODL) - attribution.
- IQAir/Google free tiers: non-commercial / credit-card may be needed.

### 6f. Useful links
- CPCB real-time: https://www.data.gov.in/resource/real-time-air-quality-index-various-locations
- XKDR: https://airquality.xkdr.org
- OpenAQ docs: https://docs.openaq.org
- Open-Meteo AQ: https://open-meteo.com/en/docs/air-quality-api
- Google AQ API: https://developers.google.com/maps/documentation/air-quality
- WAQI API: https://aqicn.org/api
- OpenWeather AQ: https://openweathermap.org/api/air-pollution
- IQAir API: https://www.iqair.com/commercial-air-quality-monitors/api

## 7. Risks & Mitigation
- Solo + scope creep (web + phone + IoT) – Mitigation: PWA first covers both web+phone, IoT as mock/stretch only.
- Smart purifier hardware access – Mitigation: Demo with virtual device / IFTTT / Google Home simulator, no real hardware needed.
- API limits – Mitigation: Cache + fallback data.
- AQI scale mismatch (US EPA vs CPCB NAQI) – Mitigation: single normalization layer, show source + index name.
- Rate limits / keys expiring during demo – Mitigation: pre-cache a demo dataset, fallback chain CPCB -> OpenAQ -> OpenWeather.
- Dual submission forgotten (code only) – Mitigation: blog + LinkedIn scheduled by 28 Nov, not last day.
- Deadline is 29 Nov 2026 (~9 days) – Mitigation: lock scope by Day 2, ship live link by Day 7.
- Small states/UTs have no ground station – Mitigation: CAMS model fallback + source badge; never show "no data".
- Tool confusion (FAQ said Antigravity required, organizers said any tools) – Mitigation: use best tool, mention Antigravity in blog if used.
- GenAI hallucinating health/impact numbers – Mitigation: deterministic calculator for all numbers; LLM only phrases, strict prompts, template fallback.
- App looks empty if the LLM/API fails – Mitigation: **data-first home** renders location, AQI, pollutants, weather, source freshness, and general guideline from rules/cache; AI is additive only.
- Medical safety from symptom check-in – Mitigation: **no diagnosis**; red flags escalate to "see a doctor now" + helpline; persistent disclaimer; no medication dosing.
- Local issue reports could be mistaken for official complaints – Mitigation: generate a complaint draft the user sends themselves; never auto-file or claim authority.
- Users distrust the AQI number – Mitigation: source badge + station name/distance + last updated + range; never a bare number.
- Tone backlash on crackers/incense – Mitigation: no moralizing; timing-based alternatives; festival mode.
- English-only excludes users – Mitigation: English default + visible 12-language switcher, icon-first, large text.
- "Buy a purifier" alienates low-income users – Mitigation: no-purifier clean-room path is always shown.
- Missing a brief keyword (communities / low-emission / sustainable / impact) – Mitigation: brief-to-feature matrix in `product-brainstorm.md`; demo the share card, swaps, and impact receipts explicitly.

## 8. Submission Checklist (PromptWars "Dual Submission")
- [ ] Built with allowed tools (record prompt/iteration trail if Antigravity/Gemini used)
- [ ] Code repo cleaned + README
- [ ] **Live preview link** deployed and working on phone
- [ ] **Technical blog post** published (how you solved it, prompts, architecture)
- [ ] **LinkedIn build-in-public post** published
- [ ] Optional: Instagram reel (4,000 bonus PC for top-5 engagement)
- [ ] Both parts submitted on Hack2Skill portal by **29 Nov 2026**
- [ ] Mention credits expire 1 Jan 2027

> Full research: see `hack2skill-research.md` in this folder.
