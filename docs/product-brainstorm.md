# AirMitra - Product Brainstorm

**AirMitra — Household Air Coach.** Not an AQI app. A **personal household air coach** - one person sets it up for themselves and the family members they look after, tells it what their home has, and gets advice only when something changed.

---

## 0. Official brief alignment

> "Create a **GenAI-powered assistant** that helps **families and communities** navigate severe winter smog and urban air pollution. The application should suggest **low-emission daily routines**, **indoor air quality hacks**, and **sustainable alternatives** tailored to their location and lifestyle, while **clearly explaining the direct impact of their choices**."

### Requirement -> implementation

| Brief requirement | Our implementation | Status |
|---|---|---|
| GenAI-powered assistant | Gemini generates the daily brief, chat answers, and "why", grounded on real AQI data + user context | Core - must be central |
| Families | Household profile (age, conditions, routine) | Covered |
| **Communities** | One person's app; community help happens by sharing generated advice cards to any chat | Covered by share cards |
| Severe winter smog | Smog-specific triggers (stubble season, inversion, Diwali, cold + still air) | Covered |
| Urban air pollution | Year-round general AQI | Covered |
| **Low-emission daily routines** | Actions that *reduce emissions*, not just exposure: carpool, metro, no-burn, idle-off, electric cooking, WFH on severe days | **GAP - add** |
| Indoor air quality hacks | Clean room, ventilation timing, exhaust after cooking, damp cloth, HEPA | Covered |
| **Sustainable alternatives** | Swaps library: incense/coil -> LED/neem, wood -> LPG/electric, disposable -> reusable N95, crackers -> public laser/drone events, waste burning -> compost | **GAP - add** |
| Tailored to location + lifestyle | 36 states/UTs + household + routine | Covered |
| **Clearly explaining direct impact of choices** | "Impact receipt" per suggestion: health dose change, emissions saved, cost saved | **GAP - strengthen** |

### What changed (3 real shifts)

1. **GenAI is the product, not a feature.** The assistant must *generate* personalized guidance (not just show templates). Rules compute the facts; the LLM writes the advice, grounded and guardrailed.
2. **"Communities" is a share action, not a feature.** One user, one app, one household. Community reach comes from exporting a card and sending it to a WhatsApp/family/society chat. No groups, codes, accounts, or shared boards.
3. **"Low-emission" + "sustainable" + "direct impact" reframes the goal.** It is not only "protect yourself from bad air" - it is also "change what you do so you emit less", with a visible impact number.

### What did NOT change

- Household profiling and the 6-screen onboarding stay.
- Non-repetitive, event-driven assistant stays.
- All 28 states + 8 UTs coverage stays.
- Optional smart home stays.

---

## 0a. The "impact receipt" (new, high-value)

Every suggestion ends with a plain-language impact line. Three flavours:

| Flavour | Example |
|---|---|
| Health | "Wearing an N95 on your 8am walk cuts your PM2.5 dose by ~85%." |
| Emissions | "Metro instead of car twice a week = ~18 kg CO2 less per month." |
| Money/effort | "Purifier on auto instead of high saves ~₹300/month and still keeps the room safe." |

Rules:
- Numbers must come from a known formula or cited factor - never invented by the LLM.
- LLM only phrases the impact; the calculator produces the value.
- Impact is **personal** ("your dose", "your family's exposure") and **home-level** where possible.

---

## 0b. Low-emission routines + sustainable swaps (new content)

**Low-emission daily routines**
- Combine errands into one trip; carpool on high days.
- Metro/bus instead of two-wheeler for the commute.
- No idling at signals/school gates; engine off.
- Segregate waste - never burn leaves/trash.
- Electric/induction cooking instead of wood/coal.
- Work-from-home on "severe" days where possible.
- Shift outdoor exercise to low-pollution windows (also lowers exposure).
- Avoid firecrackers; join public laser/drone events.

**Sustainable alternatives (with honest caveats)**
- Incense / mosquito coil -> LED diya / approved repellent
- Wood or coal cooking -> LPG / electric
- Chemical air fresheners -> ventilation + steam cleaning
- Disposable masks -> reusable fitted N95
- Diesel generator -> solar/inverter backup
- Burning waste -> compost / municipal collection
- Car for short trips -> walk/cycle/metro

> Each swap stores: what it replaces, impact estimate, cost, and a caveat (e.g., "plants look nice but don't meaningfully cut PM2.5").

---

## 0c. Community = shareable advice cards (not a shared app)

There is **no community sign-in, group, code, or shared board**. One person runs the app for their own household. "Community help" = generating a card and sending it to any chat (WhatsApp, family group, society group, school group).

### Card types (one tap to generate, one tap to share)

1. **Air advisory card** - how bad now, the directive, if-you-must, 3 do-now actions, improve time.
2. **Improve-air card** - how to make indoor air better this week, based on what the home actually has.
3. **Swap card** - one sustainable alternative with impact + caveat.
4. **Travel kit card** - mask / umbrella / inhaler / layers checklist for a trip.

### Example - air advisory card

> **Air Advisory · Greenwood · 21 Nov, 8:00 AM**
> **AQI 312 - Very Poor (PM2.5)**
>
> Don't go outside until 11:00 AM.
> If you must: fitted N95, avoid main roads, under 15 min.
> Do now: close windows · purifier on · no burning or sweeping.
> Improves to ~180 by 11:30 AM.
>
> _Shared via [app]_

### Example - improve-air card

> **Make your indoor air better this week**
> 1. Run the exhaust 10 min after cooking
> 2. Damp-mop instead of sweeping
> 3. Skip incense / mosquito coil on high days
> 4. Set up one clean room for kids and elderly
>
> Why: indoor PM can be 2-5x outdoor during cooking and dusting.
>
> _Shared via [app]_

### Rules

- The card is **self-contained**: place, date/time, AQI, actions, "why", attribution.
- **No personal data** in the card - no names, no conditions, no home inventory specifics.
- No accounts, groups, codes, leaderboards, or shared state.
- Sharing is optional; the app works fully without it.
- This is how the product reaches "communities": useful cards people forward, not a social network.

---

## 0d. India reality check (from Reddit/Facebook research)

Full write-up: `india-user-research.md`.

- **They distrust AQI numbers.** Users compare apps and see different values; many apps use satellite models. Show source, station, distance, and time - never a bare number.
- **They ask "can I go out?", not "what is AQI?".** Lead with the directive.
- **Indoor sources are the hidden problem.** Agarbatti/karpooram/coil can push indoor PM2.5 from ~80 to ~500.
- **Most homes have no purifier.** Filters cost ~₹2.2k every 3 months. The no-purifier path must always work.
- **Masks are a fit problem.** Cloth/surgical are common but ineffective; N95 discomfort is real.
- **Do not moralize** about crackers, incense, or farmers - offer timing-based alternatives.
- **Language matters.** English is the default; a language switcher offers India's most-spoken languages. ~60% cite limited language support as a barrier.
- **WhatsApp is the distribution.** Share cards must read well as a forwarded image.
- **Hyperlocal.** Air varies 100-200% within an hour; nearest station, not city average.

---

## 1. Core principles

1. **No typing.** Every input is a tap: cards, chips, icons, sliders. Works for a 12-year-old and a 70-year-old.
2. **Ask only what changes the advice.** If a question doesn't alter a recommendation, don't ask it.
3. **Silence is a feature.** The assistant must not repeat itself. If nothing changed, the home screen just updates the number.
4. **Every recommendation carries a "why".** One tap expands the reason (health + pollutant + source).
5. **Honest data.** Show whether a number is a ground station or a model estimate - plus station name, distance, last updated, and a range. Indians already distrust mismatched AQI apps.
6. **Optional, never required.** Smart home, location, notifications are all skippable.
7. **Never restrict without a fallback.** If we say "don't go out" / "avoid", we must also say what to do **if you must go out** (mask, route, duration, medication). This applies to general guidance too, not just personalised advice. Work, school, and emergencies don't pause for AQI.
8. **Never moralize.** No lectures about crackers, agarbatti, or farmers. Offer timing-based alternatives and respect the practice.
9. **Hyperlocal by default.** Nearest station, not city average. Air varies street to street and 100-200% within an hour.
10. **Assume no purifier.** Most Indian households don't own one. The clean-room path must always work without buying anything.
11. **English by default, language by choice.** The app opens in English; a visible switcher offers India's most-spoken languages. Never force a language on first launch.
12. **Data-first home, not chat-first.** The home screen always shows live location data + general guidance, even if the AI is unavailable. GenAI is the assistant layer on top, not the whole app.

---

## 2. Onboarding - "Setup in 90 seconds"

A **chip-based conversational flow** (feels like AI, no typing). 6 screens, all skippable, all editable later from Settings.

### Screen 1 - Where do you live?
- Auto-detect location -> confirm state/UT -> city/area.
- Fallback: searchable list of all 28 states + 8 UTs.
- "I travel often" toggle -> enables Travel mode.

### Screen 2 - Who do you care for?
Multi-select avatar chips (people in your home **or family members you look after**):
- Just me · Partner · Kids 0-5 · Kids 6-12 · Teens · Adults · Elderly (60+)
- Health chips: Asthma · COPD · Heart condition · Pregnant · Allergies · None

Each chip sets a **vulnerability profile** (thresholds + advice rules). No medical free-text.

### Screen 3 - Your home
Tap-select, each with an icon:
- Home type: Apartment / Independent / Ground floor / Top floor / Hostel-PG
- Cooking: LPG · Electric · Wood/coal · Community kitchen
- Windows: Mostly closed · Mostly open · Mixed
- Cooling: AC · Cooler · Fans only · None
- Air purifier: None · 1 · 2+ · Not sure
- Indoor smoke: No smoking · Someone smokes indoors · **Agarbatti / dhoop** · **Karpooram / havan** · **Mosquito coil** · None
- Cleaning: Dry sweeping · Wet mopping · Vacuum
- Pets · Indoor plants · Carpet · Dampness/mold
- (Optional) Purifier filter age: <3 months · 3-6 · 6+ · Don't know

### Screen 4 - Your day
- Wake time / sleep time (wheel picker)
- Work: Office · WFH · Outdoor job · Student · Retired
- Commute: Walk · Bus · Metro · Car · Two-wheeler · Mixed
- School run: Yes/No + time
- Outdoor exercise: Morning walk · Evening walk · Gym indoors · None
- Cooking times: Morning · Afternoon · Evening (multi-select)

### Screen 5 - Health sensitivities (optional)
- Refine severity: Mild / Moderate / Severe for each condition from Screen 2.
- "Prefer not to say" always available.

### Screen 6 - Connect (optional)
- Google Home · Alexa · Home Assistant · Skip
- Notifications: Smart (only when it matters) · Daily digest · Off
- Language: **English (default)** · then a switcher with India's 12 most-spoken languages - Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese (large-text mode toggle)
- Ship **6 fully reviewed** UI translations at launch (English + Hindi, Bengali, Marathi, Telugu, Tamil); the rest use AI-translated UI strings marked *beta*. Generated advice follows the chosen language automatically via the LLM.

**Design rules:** max 1 question per card, progress bar, "Not sure" on everything, back always works, resume later.

---

## 3. What the app knows (data model)

```
User
 ├─ location(s): home + travel destinations
 ├─ family: [ { relation, ageBand, conditions[], severity } ]   # people you care for
 ├─ home: { type, cooking, windows, cooling, purifiers, indoorSmoke, cleaning, pets, plants, carpet, damp, filterAge }
 ├─ routine: { wake, sleep, work, commute, schoolRun, exercise, cookingTimes }
 ├─ health:  [ { who, symptoms[], severity, since } ]      # user-reported
 ├─ reports: [ { type, note, location, time } ]            # local issues, private
 ├─ devices: [ googleHome | alexa | homeAssistant | none ]
 └─ preferences: { language, textSize, notificationMode }
```

This is the "context" the AI reasons over. Stored locally where possible (privacy). No accounts, no group state.

---

## 4. The assistant engine - how it avoids repeating itself

### 4.1 Event-driven, not clock-driven
Compute a **state fingerprint**:

```
fingerprint = hash(
  AQI band + dominant pollutant + 6h trend +
  weather (rain/wind/temp) + timeOfDay +
  userContextVersion
)
```

**Only generate a new proactive message when the fingerprint changes** or a hard trigger fires (e.g., AQI crosses a personal threshold).

### 4.2 Advice ledger (anti-repetition memory)
Every delivered advice gets a key: `(adviceType, location, riskBand, day)`.
- Same key within **24h** -> suppressed.
- Risk **escalates** -> allowed again, but reframed ("worse than this morning").
- User taps "Don't tell me again" -> rule disabled permanently.

### 4.3 Message budget
- Max **1 proactive nudge per 3 hours**, **3 per day**.
- Morning: one **daily brief** (3 bullets max).
- Evening: one **wrap** ("Tomorrow 7-9am is worse - plan your walk after 10").
- **Every "stay in" advice carries a "if you must go out" fallback** (N95, route, duration, medication). Never a dead-end restriction.
- Everything else lives in the app, not as a push.

### 4.4 Three message types
| Type | When | Example |
|------|------|---------|
| **Now** | Fingerprint changed | "PM2.5 crossed 120. Close the west windows; purifier on auto for 30 min. If you must go out: N95, avoid the main road." |
| **Ahead** | Forecast trigger | "Air clears after 4pm - shift your walk to 5-6pm." |
| **Why** | Only on tap | "PM2.5 is from traffic + stagnant air. Kids under 5 are more sensitive because..." |

### 4.5 Directive adapts to state (not always "stay in")

| State | Directive | If you must go out | Do now indoors |
|---|---|---|---|
| Severe / Very Poor | Don't go out until X | Fitted N95, avoid main roads, under 15 min, inhaler | Close windows, purifier on, no burning |
| Poor / Moderate | Limit outdoor time | N95 for sensitive groups, mask on commute, short trips | Ventilate when wind rises, purifier in bedroom |
| Satisfactory / Good | Good window - go out | No mask needed (sensitive: keep one handy) | Open windows, dry clothes outside, air the house |

### 4.6 Personalization rules (examples)
| Profile | Rule |
|---------|------|
| Kids 0-5 | Outdoor play advisory at AQI > 100 (others > 150) |
| Asthma | "Carry inhaler" when AQI > 150; mask earlier |
| Elderly | Shift morning walk when PM2.5 high |
| Pregnant | Stricter indoor + outdoor thresholds |
| Outdoor job | Mask + hydration + scheduled breaks |
| Smoker indoors | Flag indoor PM source, not just outdoor AQI |
| Wood/coal cooking | Ventilation + timing advice |
| No purifier | "Clean room" DIY hack instead of "buy a purifier" |

### 4.7 Asking on behalf of family members

One user can add every family member they look after and ask for them directly:

- "Is it safe for my father (asthma) to walk at 6am?"
- "Should my daughter go to school today?"
- "Which room is safest for my baby right now?"
- "My mother has COPD - what do we do tonight?"

The answer always names the person, their condition, the current state, and the reason:

> "Not for your father right now. AQI 312 + asthma = high risk before 11am. If he must go, N95 + under 15 min + inhaler. Indoors, keep him in the room with the purifier."

The **home inventory** changes the answer, not just the AQI:
- No purifier → clean-room method
- Wood/coal cooking → stop it on high days + ventilate
- Carpets → HEPA vacuum, no dry sweeping
- Dampness → mold risk alongside PM
- Top floor / many windows → different ventilation advice

### 4.8 Tell us your issue

The user can always tell the app what's going on. Three entry points, all optional.

**A. How are you feeling?** (5-second check-in, chips + optional voice)
- Chips: Cough · Wheeze · Burning eyes · Headache · Breathless · Chest tightness · Throat irritation · Nothing
- Who: Me · or a family member
- Severity: Mild · Moderate · Severe

What it does:
- Tightens thresholds and shifts advice (indoor, mask, hydration, no exercise).
- Adds a symptom note to that day's card - not a diagnosis.
- **Red flags** (breathless at rest, chest pain, severe wheeze) → "See a doctor now" + helpline. The app never diagnoses.

**B. Report a local issue** (chips + optional photo/pin)
- Types: Garbage burning · Construction dust · Factory/industry smoke · Road dust · Neighbour's coil/agarbatti · Idling traffic · Open drain
- What it does:
  - Adjusts immediate advice ("close windows on that side", "purifier boost 30 min").
  - Generates a ready complaint text the user can send to the municipal helpline/app.
  - Logs locally so patterns surface ("this happens every evening 7-9pm").
- No community backend - the report stays on the user's device.

**C. Something else** - free text or voice → GenAI with the same context.

Rules:
- Never required; the app works without it.
- **No diagnosis.** Symptoms adjust advice + escalate red flags only.
- Reports are private; nothing is posted anywhere.
- Issues feed the advice ledger, so the assistant doesn't repeat the same advice.
- Every issue can be cleared with one tap ("I'm fine now").

### 4.9 How GenAI actually works on a phone

The phone never runs the model. It is a **thin client**; your server does the AI work.

```
Phone (PWA)
  │  1. sends small JSON context (~1-3 KB)
  ▼
Serverless API route (Next.js on Vercel)
  │  2. rules engine: thresholds, advice keys, ledger
  │  3. calls Gemini API with a grounded prompt
  │  4. guardrail + deterministic impact calculator
  ▼
Gemini API  (key stays server-side, never in the app)
  │  5. returns short text (~300-800 bytes)
  ▼
Phone: renders + caches (IndexedDB)
```

Rules that make it work on Indian phones:

1. **No on-device model.** Gemini Nano only ships on newer Pixels; low-end Android can't run it. Server-side is the only realistic option.
2. **PWA, not native.** Installable from the browser, ~<1 MB shell, no Play Store, works on any Android.
3. **Call the LLM only when needed:** morning brief, user question, card generation, or a state change. Not on every screen load.
4. **Cache aggressively.** Cache generated text by `hash(location + profile flags + state fingerprint)` for 30-60 min. Precompute the 6am brief per area so it opens instantly.
5. **Show rules first, AI second.** Render the data screen immediately; swap in the personalised line when it arrives ("personalising…"). Never a spinner-only screen.
6. **Offline/failure fallback.** If there's no network or Gemini fails, the home screen still renders from rules + cached data. GenAI features show "unavailable" - the app doesn't break.
7. **Small payloads.** Send age bands, condition flags, home flags, AQI, weather - not names or full text. Symptoms as flags, not prose.
8. **Privacy.** No PII to the model. Names stay on device; the server sees "adult, asthma" not "Ramesh".
9. **Cost/latency.** ~5-10 calls per user per day; 1-3 s per call; fine on 3G. Caching cuts both.
10. **Voice is optional.** Use the browser's speech recognition on Android Chrome; fall back to chips if unavailable.

### 4.10 What changes at 1,000 / 1,000,000 users

The key insight: **AQI is per-place, not per-person.** A million users in Delhi share almost the same data and a lot of the same advice.

```
Upstream (CPCB / OpenAQ / CAMS)
   │  ONE ingestion job, every 15-30 min - never per user
   ▼
Normalise + store (Postgres/Redis)
   │
   ▼
Edge cache (CDN)  ──  GET /aqi?area=...
   │
   ▼
PWA clients (millions)
```

| Layer | ~1k users | ~1M users |
|---|---|---|
| Upstream APIs | call directly, cache briefly | one scheduled ingestion job per station, never per request |
| Data reads | serverless function | CDN/edge cache + stale-while-revalidate |
| GenAI | generate per request | precompute per **area × profile archetype**; LLM only for on-demand questions |
| Storage | none | Postgres (stations, history) + Redis (hot cache) |
| Abuse | none | per-IP + per-device rate limits |
| Cost | free tiers | LLM dominates, and caching cuts 90%+ of calls |

Non-negotiable rules at scale:

1. **Never call CPCB/OpenAQ per user request.** One ingestion worker polls each station on a schedule and writes to your cache. Users read your cache.
2. **Cache AQI per station/area for 15-30 min.** Serve stale with "updated X min ago" if upstream fails.
3. **Precompute advice per area × archetype** (e.g., 20 family/home profiles × 6 AQI bands), not per person. Personalisation becomes a short suffix, not a fresh LLM call.
4. **LLM only for chat and edge cases** - roughly 5-10% of users.
5. **Queue LLM calls** with an 8s timeout; fall back to templates.
6. **Stateless serverless** - no sticky sessions, scale horizontally.
7. **Deploy in Mumbai (`ap-south-1`)** for latency.
8. **DPDP Act 2023 hygiene** - consent, data minimisation, delete-on-request; no PII sent to the model.
9. **Observability from day one**: cache-hit ratio, p95 latency, LLM error rate, upstream freshness.

Rough cost sanity check (verify current pricing):
- 1M users, 10% ask one question/day = 100k LLM calls.
- ~300 tokens each ≈ 30M tokens/day - single-digit dollars/day on a Flash-tier model.
- Precomputed briefs are mostly cache hits; the long tail is chat.

For the hackathon you do **not** need this stack. But showing you know the difference between "demo" and "1M users" is exactly the architectural maturity judges reward.

---

## 5. Home improvement suggestions ("make the air in my home better")

Contextual, not generic:
- **Has purifier:** which room to run, when, filter-replacement reminder, auto-mode suggestion, **filter cost calculator** (~₹2.2k / 3 months in Delhi).
- **No purifier:** one-room clean-room method (closed windows, damp cloth, HEPA vacuum) - always shown, never "just buy one".
- **Gas stove:** run exhaust 10 min after cooking.
- **Agarbatti / dhoop / karpooram / havan:** respect the practice; suggest timing ("after 8pm when air clears"), fewer sticks, ventilate, or a low-smoke alternative.
- **Mosquito coil:** swap to plug-in/approved repellent on high days.
- **Dry sweeping:** damp-mop instead - it kicks up PM.
- **Carpet:** HEPA vacuum; **dampness:** mold risk.
- **Plants:** be honest - most houseplants don't meaningfully cut PM2.5.
- **Windows:** "Open now" only when outdoor AQI < estimated indoor AQI.
- **Power cut:** purifier doesn't run without power - note inverter/solar backup.
- **Indoor estimate:** outdoor AQI + window state + purifier runtime + cooking/incense events (clearly labelled *estimate*).

### India-specific modes
- **Peak-window guidance:** "close windows 6pm-11am" using the local diurnal pattern.
- **Festival mode (Diwali):** pre/post guidance and alternatives, zero shaming.
- **Winter smog mode:** stubble season, inversion, school closures, GRAP context.
- **Two-wheeler/auto exposure:** helmet + fitted mask, route timing.

---

## 6. Smart home (optional)

- **Integrations:** Home Assistant (REST/webhook), Google Home routines, Alexa routines, IFTTT.
- **Actions:** purifier on/off/auto, fan speed, "clean room" scene, read indoor PM sensor if present.
- **No hardware?** Ship a **virtual purifier simulator** so the demo works and judges can see control.
- **Safety:** explicit consent, manual override, never auto-control without opt-in.

### 6b. Indoor air monitors (optional hardware - stretch)

An outdoor AQI is not your indoor air. A monitor lets AirMitra verify purifier performance, spot cooking/incense spikes, and time ventilation. But it is **optional** - the no-sensor path must always work.

**Setup state (one screen, no typing)**
1. **No monitor** - app works; show no-sensor advice. Optional "See options" below.
2. **I have one** - pick brand/model -> connection method.
3. **Not sure** - explain what to look for: PM2.5 + CO2, a display, an app, Matter or Home Assistant.

**Connection methods (most to least practical)**
| Method | Covers | Reality |
|---|---|---|
| **Manual entry** | Any monitor with a display | User types PM2.5 / CO2. Always works. |
| **Home Assistant** | Airthings, IQAir, AirGradient, Sonoff, many Zigbee/Matter devices via HA | User enters HA URL + token. Best hackathon bridge. |
| **Vendor cloud API** | Airveda, Airthings, IQAir | Per-brand OAuth/API key; more work. |
| **Matter / Thread** | Sonoff AirGuard, IKEA Alpstuga | Needs a hub (Google/Alexa/Apple); a PWA cannot read the fabric directly. |
| **Bluetooth** | Some Xiaomi/cheap sensors | Web Bluetooth is unreliable on iOS. Skip for MVP. |

**India options (approx, verify before publishing)**
| Tier | Device | Measures | Smart |
|---|---|---|---|
| Budget ~₹4-6k | **IKEA VINDSTYRKA** | PM2.5, TVOC, temp, humidity | Zigbee; standalone or DIRIGERA |
| Budget ~₹4-6k | **Sonoff AirGuard** (SAWF-07P/08P) | PM2.5/PM10 or CO2 | Matter over Wi-Fi |
| Display only | Xiaomi / Temtop | PM2.5, temp, humidity | No useful API |
| Mid ~₹11-19k | **Airveda Sky / Aurora** | PM2.5, PM10 (+ temp/humidity) | Wi-Fi + Airveda app; JSON API on commercial plans |
| Premium ~₹22-30k | **Airveda CO2 Pro / Pulse Touch** | PM2.5, PM10, CO2, TVOC | Wi-Fi + dashboard |
| Premium | **IQAir AirVisual Pro**, **Airthings** | PM2.5, CO2, TVOC | Cloud API + Home Assistant |

**Guardrails**
- Always say **"You don't need a monitor to use AirMitra"** first.
- "See options", not "Buy now". No pressure, no medical framing.
- Disclose affiliate links if monetised.
- Sensors drift; low-cost PM sensors need calibration. Say so.
- Never gate advice on hardware.

**Stretch build (only if the core ships early)**
- Setup step + manual entry + Home Assistant connector.
- **Virtual indoor sensor** for the demo/judges (no hardware).
- Vendor APIs and Matter later.

> Build this **slowly after** onboarding, live data, and GenAI are done. The app must never depend on hardware.

---

## 7. Travel mode

Triggered when location changes or user opens "Travel".

**Trip setup (taps only):** destination, dates, transport (flight/train/bus/car), purpose (work/leisure/family).

**Outputs:**
- Destination pollution forecast for trip dates.
- **Travel kit checklist** generated from profile + destination:
  - N95 mask (vs surgical), spare filters
  - Umbrella / rain jacket
  - Inhaler / medication reminder
  - Eye drops, water bottle, layers
- Best travel/outdoor windows ("leave 30 min later, air improves").
- Transport advice: metro vs two-wheeler on high days.
- One-line "why" for each item.

---

## 8. Home screen (data-first, elderly-friendly)

The home screen is **not a chatbot**. It always shows live location data and general guidance first; GenAI personalises on top.

### Layout, top to bottom

**1. Location + live data (always visible, no AI needed)**
- `Anand Vihar, Delhi` · [Change]
- **AQI 312 — Very Poor** · PM2.5 dominant
- Pollutant chips: PM2.5 250 · PM10 380 · NO2 90 µg/m³
- Weather: 24°C · wind 4 km/h · no rain
- Source + freshness: `CPCB · 3.2 km · updated 12 min ago`
- Hourly trend (last 6h) - small sparkline, optional

**2. General guideline (for anyone at this AQI)**
- 3 short bullets, generated from rules (not AI-dependent):
  - "Reduce outdoor activity until air improves. **If you must go out:** fitted N95, short trips, avoid main roads."
  - "Keep windows closed while outdoor air is worse than indoor."
  - "Sensitive groups: stay indoors if possible. **If you must go out:** N95 and keep it under 15 minutes."

**3. Personalised for your family**
- "For your father (asthma): no walk before 11am."
- "For your daughter (6): indoor play today."

**4. If someone in your family must go out**
- Per-person fallback:
  - "Father (asthma): fitted N95 + inhaler, under 15 min, avoid main roads."
  - "Daughter (6): avoid if possible; if not, N95 and a short route."
- General: early morning is worst; prefer 11am-4pm.

**5. Do now at home**
- 3 actions based on the home inventory (purifier / no purifier / cooking / agarbatti).

**6. Actions**
- **Ask** (GenAI chat) · **Report issue** (symptoms / local problem) · **Share card** · **Plan tomorrow**

### Rules
- If GenAI is down, sections 1, 2, 4, 5 still render from rules + cached data. The app never becomes a blank chat screen.
- **One big number** + color, but never the only thing.
- **Read aloud** button (voice) + large-text mode.
- **For my parents** quick switch.
- Language switch always visible; **English default**, 12 Indian languages selectable.
- Offline: last-known value with timestamp.

### India trust bar (small, always visible)
> `CPCB · Anand Vihar · 3.2 km · 12 min ago · ground monitor`
> or `Model estimate · CAMS · updated 1h ago`

No bare number. Users already compare apps and distrust mismatches.

### Two clients, one codebase

**Mobile PWA - single column**
- Sticky top: location + AQI + trust bar
- Content: general guideline → family notes → if-you-must → do-now
- Bottom tabs: Today · Ask · Report · Cards · Settings
- Install prompt, large tap targets

**Desktop website - multi-column**
- Left sidebar: location switcher + saved places
- Center: live data + pollutants + 24h sparkline + map
- Right rail: guidance + Ask panel
- Keyboard: `/` ask, `L` location, `S` share

Same API, rules, copy, and i18n. Only the layout shell differs.

---

## 9. Non-repetition - worked example

> **Mon 8am:** "PM2.5 is 180. Keep windows closed, purifier on. Kids: indoor play today." *(why: school run + high PM)*
>
> **Mon 11am:** *(nothing - fingerprint unchanged)*
>
> **Mon 1pm:** "Cooking now? Run the exhaust for 10 min after." *(new trigger: cooking time)*
>
> **Mon 4pm:** "Air improving - good window to open up for 30 min." *(fingerprint changed)*
>
> **Tue 8am:** "Better than yesterday (120 vs 180), but still sensitive-group range. Walk is fine after 10am." *(escalation/de-escalation reframing, not a repeat)*

---

## 10. MVP vs stretch

### MVP (must ship)
- 6-screen onboarding (chip-based)
- All 36 states/UTs + **nearest-station trust bar** (source, distance, updated)
- Home screen: **live location data + general guideline** + personalized directive + if-you-must (works without AI)
- Routine-aware advice engine + advice ledger
- **GenAI ask + daily brief (grounded, guardrailed)**
- **User-reported issues:** symptom check-in (red-flag escalation, no diagnosis) + local issue report with complaint text
- **Impact receipts (health / emissions / money)**
- **India adaptations:** indoor-source checklist, no-purifier clean room, mask fit, filter-cost calculator
- **Low-emission routines + sustainable swaps**
- **Shareable advice cards (air advisory + improve-air + swaps + travel kit)**
- Travel mode + kit
- **Two clients, one codebase:** responsive desktop website + installable mobile PWA
- English default + 12-language switcher, large-text mode

### Stretch (only if time)
- Home Assistant / Google Home control + virtual purifier
- Indoor AQI estimation
- Voice read-aloud
- Least-polluted route
- Human-reviewed translations for the remaining languages
- Capacitor APK wrapper for Android (same codebase)

---

## 11. Judging story (one line)

> "Most AQI apps tell you a number. This GenAI coach knows your family, your home and your routine - and tells you the one thing to do next, the impact it has, and why - only when something actually changed. Then you can forward that advice to anyone."

---

## 12. Open decisions

1. **Assistant persona/tone:** calm health coach vs friendly companion vs neutral advisor.
2. **Proactive vs on-demand:** how chatty should it be by default?
3. **Language scope:** all 12 in the switcher, with 6 fully reviewed at launch and the rest marked beta?
4. **Demo hardware story:** virtual purifier simulator vs real plug/Home Assistant.
