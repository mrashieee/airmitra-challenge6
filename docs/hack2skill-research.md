# Hack2Skill & PromptWars Virtual - Research Brief

_Compiled: 20 Nov 2026 · For: Muhammad Rashid K · Challenge 06_

---

## 1. What is Hack2Skill?

- **Hack2skill Private Limited** - Noida, India. Upskilling + hackathon/innovation-management platform.
- Runs hackathons for companies, colleges, and communities; also hosts its own programs.
- Website: hack2skill.com · Support: support@hack2skill.com / info@hack2skill.com
- Socials: LinkedIn (~113k), X, Instagram, YouTube, Facebook.

## 2. What event are you actually in?

You are in **PromptWars: Virtual** (not a generic Hack2skill hackathon).

| Item | Detail |
|------|--------|
| Full name | PromptWars: Virtual - Season (Build with AI) |
| Organisers | **Google for Developers × Hack2skill** |
| Format | Bi-weekly online "vibe coding" challenge, **individual only** (no teams/duos) |
| Eligibility | India only; students, professionals, indie devs all welcome |
| Platform / tool | **Any tools allowed** (organizers confirmed to the participant). FAQ still says Antigravity is required - clear it with support, but plan for any stack. |
| Current round | **Main Challenge 06 - Urban Air Quality Assistant** |
| Challenge 06 deadline | **29 November 2026** |
| Season status | 5 challenges completed, Challenge 06 live, 3 remaining (8-challenge season) |
| Registration | https://vision.hack2skill.com/event/pwvirtual1/registration |
| Support | promptwarssupport@hack2skill.com |

## 3. The 14-day cycle (how each challenge works)

1. **Day 1 (Monday) - Challenge release.** New real-world problem, tagged Beginner / Intermediate / Advanced.
2. **Building phase.** Build a functional app using Google Antigravity / AI tools ("intent-driven development").
3. **Day 13 - Submission phase (Dual Submission):**
   - **Technical:** source code + **live preview/deployed app**
   - **Narrative:** technical blog post **and** a LinkedIn "Build-in-Public" post
4. **Day 14 - Evaluation & announcement.** Experts review; valid submissions climb the leaderboard and earn Prompt Credits.

> Every Friday after a Monday drop, Hack2skill hosts a **live Introductory & Problem Statement Explainer Session** (YouTube). Worth attending/watching for Challenge 06.

## 4. Challenge 06 brief (official, from website)

> "Create a **GenAI-powered assistant** that helps **families and communities** navigate severe winter smog and urban air pollution. The application should suggest **low-emission daily routines**, **indoor air quality hacks**, and **sustainable alternatives** tailored to their location and lifestyle, while **clearly explaining the direct impact of their choices**."

Decomposed requirements:
1. GenAI-powered assistant (generation is core)
2. Audience: families **and communities** - implemented as a single-user app per household; community reach via shareable advice cards, not a group feature
3. Domain: severe winter smog + general urban pollution
4. Suggest low-emission daily routines
5. Suggest indoor air quality hacks
6. Suggest sustainable alternatives
7. Tailored to location + lifestyle
8. Clearly explain the **direct impact** of choices

> Older promo copy said "personalized low-emission routines, indoor air quality hacks, sustainable swaps (plus the why)" - same spirit, but the official brief adds **communities** and **direct impact**, and makes GenAI explicit.
>
> **Interpretation decision:** the app is personal (one user, their family, their home). "Communities" is satisfied by generating advice cards the user forwards to any WhatsApp/family/society group. No accounts, groups, codes, or shared state.

## 4b. Competitive landscape (checked 21 Nov 2026)

| Product | What it does | Overlap |
|---|---|---|
| **SaafHawa** | AI layer on public AQI; asks who is in your home | Very high |
| **Saans Saathi** | "Tells you what to do" for outdoor workers; IIT KGP copyright | High |
| **Open Window** (iOS) | Window-timing verdict: open / briefly / wait | High on one feature |
| **Aerzeit** (iOS) | When to open windows; 50 languages | High on one feature |
| **AirLens** | Inhaled dose + cleanest route | Medium |
| **AirVista** | WRF-Chem forecast app | Medium |
| **AirCompass** | Monitoring + alerts | Medium |
| **AirNest** | Indian AQI monitor / purifier hardware | Medium |

**Differentiation to make visible in the demo:**
- household inventory (no purifier, gas stove, agarbatti) → advice changes
- "if you must go out" fallback everywhere
- impact receipts (dose / CO2 / ₹)
- all 36 states + source/distance/freshness trust bar
- symptom check-in + local issue report
- share cards for WhatsApp

Do **not** claim novelty on "AQI + advice" — claim depth on the household context and the safety fallback.

## 5. How you are judged

- **Solution quality** - does it actually solve the problem for families/communities?
- **Prompt quality / architectural elegance** - how well you drove Antigravity (this is a "vibe coding" contest; prompt craft matters).
- **Demo / pitch clarity** - is it working and easy to understand?
- Validity: complete **both** technical + narrative parts. (Tool requirement: official FAQ says Antigravity; organizers told this participant any tools are allowed - confirm in writing.)

## 6. Rewards system (Prompt Credits)

- Credits are **swag currency**, not cash (virtual edition).
- Only **Top 400** per challenge earn credits; Rank 1 = **5,000 PC**, Rank 400 = **500 PC**.
- Credits **stack across challenges** and are spent at swagstore.hack2skill.com.
- Example swag costs: Mobile Stand 1,150 · Diary 1,250 · Backpack 4,000 · Hoodie 5,000 · Premium Backpack 11,025.
- **Bonus credits:**
  - Instagram reel: 4,000 PC/challenge (top 5 by engagement)
  - Top 50 in 3 consecutive challenges: 25,000 PC
  - Top 50 in 8/10 consecutive: up to 125,000 PC
  - Top 3 women developers: 1,500 PC/challenge
- **Credits expire 1 Jan 2027** - redeem before then.
- Note: site copy is inconsistent (older docs say 18 challenges / different streak tiers) - treat the live page as source of truth.

## 7. Rules & integrity

- Explicitly banned: **plagiarism, cheating, multiple accounts**, unfair practices -> disqualification and prize revocation.
- Official FAQ says **Google Antigravity** is required; organizers told you any tools are allowed. Get this in writing (email/support) to be safe.
- Individual participation only for PromptWars Virtual.
- Hack2skill reserves the right to shortlist/verify and to interpret rules.

## 8. What this means for your build (strategy)

1. **Data-first home, assistant on top.** The home screen always shows live location data (AQI, pollutants, weather, source + freshness) and general guidance. GenAI personalises and answers questions - it is not the whole screen.
2. **Lead with the "why".** Every recommendation needs a one-line reason (health impact, pollutant source, timing).
3. **Personalisation is the differentiator.** Household profile: kids, elderly, asthma, pregnancy, commute time, indoor/outdoor.
4. **Use whatever ships fastest.** If you use Antigravity/Gemini, show it in the blog - it is scored favourably, but any tool is allowed per organizers.
5. **National coverage is a feature, not a checklist.** All 28 states + 8 UTs must return a value; label ground vs model data honestly.
6. **Dual submission is mandatory.** Budget real time for the technical blog + LinkedIn post; don't leave it to the last hour.
7. **Ship a live link.** "Live preview" is part of the technical submission - deploy early (Vercel/Cloud Run).
8. **Bonus credits are cheap points.** One Instagram reel can out-earn a mid leaderboard rank.
9. **"Community" is a share card, not a feature.** One user runs their own app; forwarding an advice card to a WhatsApp/society group is the community mechanism. Don't build groups, codes, or accounts.
10. **Design for Indian reality, not Western AQI-app norms.** Source transparency, no-purifier paths, indoor sources (agarbatti/coil), English default + 12-language switcher, non-judgmental festival advice. See `india-user-research.md`.

## 9. Useful links

- Event page: https://hack2skill.com/event/pwvirtual1
- Program site: https://promptwars.in/promptwarsVirtual.html
- Community: https://hack2skill.com/pw-community
- Registration: https://vision.hack2skill.com/event/pwvirtual1/registration
- Swag store: https://swagstore.hack2skill.com/items
- Credits guide (Google Doc): https://docs.google.com/document/d/e/2PACX-1vRvT-PacPZRltgWrXO3ZDRNYAKeZEeH0hfN2GUWAemU2bT27Wjp3jzDnQcCZqOKJE3ftXqbG45f-HF4/pub
- Support: promptwarssupport@hack2skill.com

## 10. Open questions to confirm on the dashboard/live session

- Exact Challenge 06 rubric weights (if published).
- Whether a specific Gemini model / Antigravity plan is required.
- Whether the blog must be on a specific platform (Hashnode/Medium/LinkedIn article).
- Exact submission portal fields + file limits.
- Any restriction on external APIs (CPCB/OpenAQ) for the demo.
