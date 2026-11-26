import { readingFromAir } from "@/lib/aqi";
import type { AirReading } from "@/lib/air/types";
import type { Profile } from "@/lib/profile";
import type { StateEntry } from "@/lib/states";
import type { Brief } from "./types";

export function templateBrief(
  state: StateEntry,
  air: AirReading,
  profile: Profile,
): Brief {
  const reading = readingFromAir(state, air, undefined, false, profile);
  const key = reading.band.key;

  const directive =
    key === "severe" || key === "veryPoor"
      ? "Keep everyone indoors until the air improves."
      : key === "poor" || key === "moderate"
        ? "Limit outdoor time and keep windows closed."
        : "Good window - open up and go out.";

  return {
    directive,
    why: `${reading.dominant} is dominant at AQI ${reading.aqi} (${reading.band.label}).`,
    mustGoOut:
      reading.mustGoOut[0]?.advice ??
      "Fitted N95, short trips, avoid main roads.",
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
    return "Skip incense or mosquito coil today. If you must, light it 8–10 PM with a window open. Indoors, these can push PM2.5 up 3–5x for 1–2 hours.";
  }

  if (q.includes("window") || q.includes("open")) {
    return reading.guidelines[1] ?? "Keep windows closed at peak hours.";
  }

  if (q.includes("purifier")) {
    return profile.home.purifiers === "None"
      ? "You don't need to buy one today. Pick one room, close the door, damp-mop, and keep windows shut. That cuts indoor PM noticeably."
      : "Run the purifier in the room you use most, on auto, with the door closed.";
  }

  if (
    q.includes("breath") ||
    q.includes("chest") ||
    q.includes("emergency")
  ) {
    return "Breathless at rest or chest tightness is not something to wait on. See a doctor now or call emergency services. AirMitra cannot diagnose.";
  }

  return `${reading.guidelines[0]} For your family: ${reading.family[0]?.advice ?? "Keep sensitive members indoors."}`;
}
