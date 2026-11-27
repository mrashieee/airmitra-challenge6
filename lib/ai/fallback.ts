import { readingFromAir } from "@/lib/aqi";
import type { AirReading } from "@/lib/air/types";
import type { Profile } from "@/lib/profile";
import type { StateEntry } from "@/lib/states";
import type { Brief } from "./types";
import { t } from "@/lib/i18n";

export function templateBrief(
  state: StateEntry,
  air: AirReading,
  profile: Profile,
): Brief {
  const reading = readingFromAir(state, air, undefined, false, profile);
  const key = reading.band.key;
  const language = profile.language;

  const directive =
    key === "severe" || key === "veryPoor"
      ? t(language, "r.brief.severe")
      : key === "poor" || key === "moderate"
        ? t(language, "r.brief.limit")
        : t(language, "r.brief.good");

  return {
    directive,
    why: t(language, "r.brief.why", {
      dominant: reading.dominant,
      aqi: reading.aqi,
      band: reading.band.label,
    }),
    mustGoOut:
      reading.mustGoOut[0]?.advice ?? t(language, "r.brief.mustGo"),
    doNow: reading.doNow.map((item) => item.title).slice(0, 3),
    source: "template",
    model: "rules",
    city: air.state.city,
    generatedAt: new Date().toISOString(),
  };
}

export function templateAnswer(
  question: string,
  state: StateEntry,
  air: AirReading,
  profile: Profile,
): string {
  const reading = readingFromAir(state, air, undefined, false, profile);
  const language = profile.language;
  const q = question.toLowerCase();

  const byName = reading.family.find((person) =>
    q.includes(person.name.toLowerCase()),
  );
  const byCondition = reading.family.find(
    (person) =>
      (q.includes("asthma") && person.meta.toLowerCase().includes("asthma")) ||
      (q.includes("child") && person.meta.toLowerCase().includes("6-12")) ||
      (q.includes("school") && person.meta.toLowerCase().includes("6-12")),
  );

  if (byName || byCondition) {
    const person = byName ?? byCondition!;
    return `${person.name}: ${person.advice}`;
  }

  if (q.includes("agarbatti") || q.includes("incense") || q.includes("coil")) {
    return t(language, "r.answer.agarbatti");
  }

  if (q.includes("window") || q.includes("open")) {
    return reading.guidelines[1] ?? t(language, "r.answer.windows");
  }

  if (q.includes("purifier")) {
    return profile.home.purifiers === "None"
      ? t(language, "r.answer.purifierNone")
      : t(language, "r.answer.purifier");
  }

  if (
    q.includes("breath") ||
    q.includes("chest") ||
    q.includes("emergency")
  ) {
    return t(language, "r.answer.emergency");
  }

  return t(language, "r.answer.fallback", {
    guideline: reading.guidelines[0],
    advice:
      reading.family[0]?.advice ?? t(language, "r.advice.genericCalm"),
  });
}
