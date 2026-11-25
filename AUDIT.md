# AirMitra — Honest Functional Audit

_22 Nov 2026. Method: code inspection, live endpoint tests, Chrome installability check, and manual state review. Scores are for a hackathon MVP, not production._

---

## Scorecard

| # | Area | Status | Score |
|---|---|---|---|
| 1 | Live AQI data (CPCB/CAMS) | Working | **8/10** |
| 2 | Location + city search | Working | **8/10** |
| 3 | Onboarding + profile | Working | **7/10** |
| 4 | Home guidance | Working | **7/10** |
| 5 | Weather visuals | Working | **9/10** |
| 6 | Ask assistant | **Working (AI + fallback)** | **6/10** |
| 7 | Report symptoms/issues | **Partial / local only** | **4/10** |
| 8 | Share cards | **Partial** | **5/10** |
| 9 | Settings | Working | **6/10** |
| 10 | Language switching | **Preference only** | **4/10** |
| 11 | PWA | Working | **8/10** |
| 12 | Rules engine | **Partial** | **5/10** |
| 13 | Travel mode | **Missing** | **0/10** |
| 14 | Dark mode | **Missing** | **0/10** |
| 15 | Accessibility | Partial | **6/10** |
| 16 | Data trust / transparency | Working | **8/10** |
| 17 | Performance | Working | **8/10** |
| 18 | Error handling | Working | **7/10** |
| 19 | Automated tests | Ad-hoc only | **6/10** |
| 20 | Security | Partial | **6/10** |

**Overall MVP readiness: ~7.2/10.** Strong shell and data; the intelligence layer is now real, with fallbacks.

---

## What is genuinely working

### 1. Live data — 8/10
- CPCB ground stations, nearest-station selection, 30 km cutoff.
- CAMS fallback at the selected city.
- CPCB NAQI computed from PM2.5/PM10.
- Cache + stale-ground fallback + degraded flags.
- City-level queries verified: Mumbai (Kurla), Pune (Shivajinagar), Kozhikode (CAMS, nearest CPCB 82 km).
- API response times: 0.8–1.8 s warm.

**Issues**
- AQI is PM-only; gases are displayed but not used.
- CO unit handling is ambiguous; currently hidden from hero chips.
- Sparse CPCB coverage in Kerala, Northeast, islands.
- 6 s per-request timeout + 6.5 s overall CPCB cap, then CAMS fallback.
- No API-level rate limiting.

### 2. Location — 8/10
- State dropdown + state-scoped search.
- City dropdown removed as requested.
- Open-Meteo + Photon/OSM merged, settlements only.
- Approximate fallback when a town isn’t indexed.
- Auto-location snaps to nearest major city.
- Location persists across reloads.

**Issues**
- No free geocoder has every village.
- No map-pin fallback for places no database has.
- Search only inside the chosen state (by design).

### 3. Onboarding — 7/10
- 6 steps, chips, skip, resume via saved profile.
- Family, home, routine, health, language, text size.
- Editable from Settings.
- Cooking/cooling multi-select with exclusive `None`.

**Issues**
- `severity` now changes thresholds; `routine` is still stored but **not used**.
- `routine` is stored but **never used** in advice.
- No validation for empty family.
- No mid-flow autosave (only on finish/skip).

### 4. Home guidance — 7/10
- Data-first hero, general guideline, family, if-you-must, do-now, impact.
- Home inventory changes some do-now items.
- Weather-aware, animated hero.

**Issues**
- General guidelines are static per AQI band, not profile-aware.
- Family advice ignores severity and routine.
- Impact receipt is a fixed estimate, not calculated from profile.
- “For your family” still uses hardcoded father/daughter only when no profile.

### 5. Weather — 9/10
- Real condition + day/night from Open-Meteo.
- Animated sun, clouds, rain, fog, snow, stars, thunder.
- Reduced-motion respected.
- Verified frames change.

**Issues**
- Current weather only; no forecast in the hero.
- Night gradients are still light (text contrast choice).
- No weather alerts.

### 6. Ask — 6/10
- `/api/ask` uses Gemini with grounded context.
- Model fallback: `gemini-3.1-flash-lite` → `gemini-flash-lite-latest` → rules.
- Template fallback for emergencies/503s.
- Answers are natural and person-specific.
- Cache by context + question.

**Issues**
- Model is intermittent: 503s and 8 s timeouts.
- No streaming; users wait 3–10 s.
- No conversation memory beyond the visible thread.
- Cache/fallback labels are honest but can make the demo inconsistent.

### 6b. Brief — 6/10
- `/api/brief` generates directive, why, must-go, and 3 do-now items.
- Shows only when AI responds; static guidance appears instantly.
- Forbids quoting pollutant concentrations.
- Cached; template fallback if Gemini fails.

**Issues**
- First load can take 8–10 s.
- Template fallback is cached for 5 min.
- No A/B check that the model’s numbers match the calculator.

### 7. Report — 4/10
- Symptom chips, severity, red-flag escalation.
- Local issue chips.
- “Saved” confirmation.

**Issues**
- Nothing persists; refresh loses it.
- Symptoms do not change today’s advice.
- No complaint draft generated.
- No photo/location picker.

### 8. Share cards — 5/10
- Preview card, copy text, native share fallback.
- Text-only; no image export.

**Issues**
- “Improve-air card” is a placeholder.
- No actual WhatsApp image generation.
- Card doesn’t include family/home specifics (by design, but still generic).

### 9. Settings — 6/10
- Edit setup, large text toggle, language selector, data note.
- Large text persists.

**Issues**
- Language selector changes the label only; **UI stays English**.
- No notification controls.
- No clear-data action.

### 10. Language — 4/10
- 13 languages selectable as a **preference**; UI is explicitly labelled English for now.
- No translations built; advice is still English.

**Decision needed:** either implement translations for dynamic AI text + static UI, or mark it “English only (beta languages soon)”.

### 11. PWA — 8/10
- Manifest, service worker, installable; Chrome installability returned **no errors**.
- Offline shell works.
- Icons are SVG only (Chrome accepted them, but PNG 192/512 is safer).

**Issues**
- API data is not cached for offline.
- No update prompt for new service worker.

### 12. Rules engine — 4/10
- Basic family/home rules.
- No state fingerprint, no advice ledger, no time triggers, no per-member thresholds using severity.
- Routine has zero effect.

### 13. Travel — 0/10
- Not built. Docs describe it; code does not exist.

### 14. Dark mode — 0/10
- Not built.

### 15. Accessibility — 6/10
- Large text, tap targets, contrast mostly fine.
- Many labels at 10px; small for elderly users.
- Some icon-only buttons lack labels.
- Language switching is non-functional.

### 16. Data trust — 8/10
- Source, station, distance, freshness, model vs ground, nearest-station distance, degraded flags.
- Good.

### 17. Performance — 8/10
- Warm API 0.8–1.8 s; cache works.
- CPCB now capped at 6.5 s, then CAMS fallback.
- Initial mock → live swap is clean.

### 18. Error handling — 7/10
- Mock fallback, stale data, degraded labels.
- No “Retry” button.
- API failures silently fall back to demo.

### 19. Tests — 6/10
- 45/45 smoke checks were run earlier, but the script is not committed.
- No unit tests for NAQI, fallback, profile migration.

### 20. Security — 6/10
- Keys server-side, `.env` gitignored.
- Keys were shared in plaintext and **not rotated yet**.
- No auth/rate limiting on public API.

---

## What I would change before deploy

1. **Add a timeout + retry cap to CPCB** (6 s). Fall back to CAMS instead of waiting 11 s.
2. **Use severity in advice.** Mild/Moderate/Severe should change thresholds.
3. **Use routine in advice.** Wake, school run, cooking, exercise, sleep should gate recommendations.
4. **Be honest about language.** Either translate or label “English only for now”.
5. **Persist symptoms/issues for the day.** Otherwise Report is cosmetic.
6. **Add a Retry state** when live data fails.
7. **Rotate keys** before deploy.

## What to cut from the MVP

- Travel mode (missing; don’t claim it)
- Dark mode (stretch)
- Improve-air card image (stretch)
- Full 13-language translations (stretch; English + Hindi at most)

## Verdict

The app looks and feels finished, and the assistant is now real. Data, onboarding, weather, PWA, brief, and ask are solid. The remaining gaps are the rules/ledger, deploy, and submission assets.
