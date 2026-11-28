# Changelog

## 2026-11-28 — web release

- **Home and current location are separate.** Home is saved in the profile and
  edited in Settings; current is set from the header, search, or GPS. Switching
  current never overwrites home. Green `Home` / amber `Current` badges and a
  Home button.
- **GPS.** `navigator.geolocation` → `/api/reverse` → nearest known city, with
  inline permission/accuracy errors. Coordinates are not saved as home.
- **Median station AQI.** With 2+ fresh official monitors, the headline is the
  rounded median of the station AQI values, with the station range. Pollutant
  chips remain median concentrations. Nearby-monitor median is still used when
  a city has no station.
- New 2:41 product film, new Inter thumbnail, captions and publishing copy.
- Docs refreshed: README, PACKAGING, SECURITY, docs video page, submission pack.

## 2026-11-27 — packaging and security

- Android 1.0.1 APK with a rotated signing key; Digital Asset Links updated.
  Uninstall 1.0.0 before installing 1.0.1.
- Linux AppImage and Windows installer published under the desktop release.
- Security and credential-rotation guidance added.

## 2026-11-26 — GenAI and sharing

- Grounded `/api/brief` and `/api/ask` with model fallback and rule-based
  templates.
- Hourly brief refresh, period-specific do-now advice, daily give-back idea.
- High-quality story card with WhatsApp/X/Telegram/Facebook/LinkedIn sharing.
- Public city pages, sitemap, dark mode and the weather hero.

## 2026-11-25 — data layer

- CPCB → OpenAQ → nearby monitors → CAMS chain with source, distance and age.
- CPCB NAQI headline with a US AQI comparison.
- 1,238-city search across 28 states and 8 union territories, with former names
  and common typos.
- 13 Indian languages, language-first onboarding, Accessibility as the final
  setup step.
