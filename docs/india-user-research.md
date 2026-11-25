# India User Research - Reddit & Facebook Signals

_Compiled 20 Nov 2026. Sources: Reddit threads (r/delhi, r/india, r/IndiaSpeaks, r/TamilNadu) and public Facebook groups/pages. Forum evidence is urban, English-speaking and skewed - treat as directional, not representative._

---

## 1. What Indians actually complain about

### 1.1 "The AQI numbers don't match"
- r/IndiaSpeaks thread: **"aqi.in is showing inflated/inconsistent data"** - users compare apps and get different values.
- Explanation in the thread: many apps use **satellite-derived PM2.5 + spatial modelling**, not the nearest ground monitor.
- Separate threads allege government monitors being manipulated / data disruptions.
- **Lesson:** trust is the #1 product problem. Show *source*, *station distance*, *last updated*, and a range - not a single confident number.

### 1.2 "I don't know what to do with the number"
- r/delhi is full of "how are you dealing with this?" threads - people want actions, not indices.
- Recurring advice from users themselves:
  - "Close your house after 6pm until next afternoon."
  - "Run the purifier on max during peak pollution."
  - "Multiple purifiers + N95 - only those protect from PM2.5."
  - "Buy an air purifier" is the default answer - which excludes most households.
- **Lesson:** decision-first UI ("go out / don't / until when") beats dashboards.

### 1.3 Indoor sources are the hidden problem
- r/TamilNadu: **karpooram + agarbatti pushed indoor PM2.5 from ~80 to ~500**.
- Mosquito coils, candles, dhoop, havan smoke repeatedly flagged.
- Many users don't connect these to indoor AQI.
- **Lesson:** a huge differentiator is naming *indoor* sources (agarbatti, coil, cooking, sweeping) and giving respectful swaps - not just outdoor AQI.

### 1.4 Purifiers are expensive; filters are the real cost
- r/india / r/AirPurifiersIndia: Xiaomi filters ~₹2.2k every ~3 months in Delhi; electricity is low (~27-40W).
- r/delhi: a high-end purifier at ₹1.8L with AMC and filter every 45 days.
- Many households cannot buy one at all.
- **Lesson:** always provide a **no-purifier clean-room path**. Add a filter-cost calculator. Never make "buy a purifier" the only answer.

### 1.5 Masks: fit and comfort, not awareness
- r/delhi doctor rant: "please start wearing N95" - emphasis on **fit**, no gaps.
- Users note cloth/surgical masks are common but ineffective; N95 uncomfortable for long wear; skepticism about cheap "Indian N95" quality.
- **Lesson:** mask guidance must be practical: N95/KN95, fit check, when it's worth it, when it isn't, reuse rules.

### 1.6 Culture and tone
- Diwali/firecracker advice is emotionally charged. A widely upvoted comment notes that telling Indians not to burst crackers can be read as attacking religious sentiment.
- Agarbatti and karpooram are tied to daily puja.
- **Lesson:** never moralize. Offer alternatives + timing ("burn after 8pm when air clears", "use one instead of three") and respect the practice.

### 1.7 Language and accessibility
- KPMG-Google study: ~70% of Indian-language internet users struggle with English keyboards; ~60% cite limited language support as the biggest adoption barrier; ~68% trust local-language content more.
- **Lesson:** English default + a visible language switcher for India's most-spoken languages; icon-first UI, large text, read-aloud.

### 1.8 Hyperlocal, not city-level
- Air can change 100-200% within an hour and varies street to street.
- Users want "my area", not "Delhi average".
- **Lesson:** nearest station first, show distance, and never present a city average as *your* air.

### 1.9 WhatsApp and RWA are the real distribution
- Facebook groups: Delhi residents groups, AQI.in.Delhi, RWA advisories ("RWA members should keep our..."), civil-society campaigns.
- RWAs already issue pollution advisories to residents.
- **Lesson:** the share-card design is correct for India. Cards must look good as a WhatsApp image and be readable at a glance.

### 1.10 People describe symptoms, not AQI
- r/delhi: "picked up a sore throat and a blocked nose", "breathing issues", parents terrified for 60+ family members.
- Users want to know "is this because of the air?" and what to do tonight.
- **Lesson:** offer a 5-second symptom check-in that adjusts advice and escalates red flags - but **never diagnose**.

---

## 2. What this changes in the app

| Signal | Product change |
|---|---|
| AQI distrust | Source badge + station name/distance + last-updated + "estimate" label + range, not false precision |
| "What do I do?" | Home screen leads with directive + if-you-must + do-now, number secondary |
| Indoor sources | Add agarbatti / coil / karpooram / havan / sweeping / cooking to home inventory + swaps |
| Purifier cost | No-purifier clean-room path; filter-cost calculator; running-cost estimate |
| Mask reality | N95/KN95 fit guide, cloth-mask warning, reuse rules, "when it matters" |
| Cultural tone | Non-judgmental swaps; timing-based alternatives for crackers/incense |
| Language | **English default** + 12-language switcher, large text, read-aloud |
| Hyperlocal | Nearest-station lookup with distance; no city-average-as-yours |
| WhatsApp | Share cards designed as 1:1 image, large text, place + time + actions |
| Vulnerable parents | "For your parents" mode with stricter thresholds and check-in prompts |
| Symptoms | 5-second check-in (chips + voice) adjusts advice, escalates red flags, no diagnosis |
| Local issues | Report garbage burning / construction dust / factory smoke; get advice + complaint draft |

---

## 3. India-specific features worth adding (cheap)

1. **Peak-window guidance** - "close windows 6pm-11am", based on local diurnal pattern.
2. **Indoor source checklist** - one-time taps: agarbatti, coil, karpooram, havan, smoking, sweeping, cooking fuel.
3. **No-purifier clean room** - step-by-step, 10 minutes.
4. **Mask fit in 20 seconds** - seal check instructions.
5. **Filter cost calculator** - "your purifier costs ~₹X/year in filters".
6. **Power-cut note** - purifier useless without power; inverter/solar tip.
7. **Festival mode** - Diwali: pre/post guidance, alternatives, no shaming.
8. **Winter smog mode** - stubble season + inversion + GRAP/school-closure context.
9. **Two-wheeler/auto exposure** - helmet + mask combination, route timing.
10. **"For my parents" quick switch** - one tap to see advice for an elderly parent.

---

## 4. What NOT to build (from the research)

- Another city-ranking / "most polluted city" screen - feeds doom, no action.
- A single hard AQI number with no source - the exact thing users distrust.
- Moralizing content about crackers, incense, or farming.
- "Buy a purifier" as the primary recommendation.
- English-only, text-heavy UI.
- Accounts, groups, leaderboards - not what users asked for.
- Complex charts on the home screen - users want the decision.

---

## 5. Evidence links

Reddit:
- https://www.reddit.com/r/IndiaSpeaks/comments/1pmgjuf/aqiin_is_showing_inflatedinconsistent_data
- https://www.reddit.com/r/delhi/comments/1orfo8t/how_are_you_guys_dealing_with_the_pollution
- https://www.reddit.com/r/delhi/comments/1xrak2b/apart_from_air_purifies_what_helps_first_time
- https://www.reddit.com/r/delhi/comments/1gubxyk/wtf_is_this_pollution_measures_to_apply_at_home
- https://www.reddit.com/r/delhi/comments/1p4ojl0/please_start_wearing_n95_masks_rant_from_a_doctor
- https://www.reddit.com/r/TamilNadu/comments/1bqu3n5/karpooram_and_agarbathi_has_very_bad_impact_on
- https://www.reddit.com/r/india/comments/c1rlhr/do_air_purifiers_work
- https://www.reddit.com/r/AirPurifiersIndia
- https://www.reddit.com/r/delhi/comments/ypd8lj/what_masks_to_be_used_for_pollution_and_smog

Facebook (public groups/pages):
- Delhi residents air quality group: https://www.facebook.com/groups/267609054656260
- AQI.in Delhi group: https://www.facebook.com/groups/AQI.in.Delhi
- RWA / civil society campaigns: https://www.facebook.com/indiaaq
- CMS Vatavaran Breath of Change: https://www.facebook.com/CMSVATAVARAN

Other:
- KPMG, Indian Languages - Defining India's Internet (language barriers)
- Microsoft Source Asia, Atmos hyperlocal sensors (air varies 100-200% within an hour)

---

## 6. Research caveats

- Reddit/Facebook skew urban, English-speaking, higher-income, Delhi/NCR-heavy.
- Rural and small-town users (biomass cooking, no purifier, feature phones) are underrepresented.
- Facebook group content is partly inaccessible without login; snippets used.
- Treat these as hypotheses to validate with 5-10 real users, not final truth.
