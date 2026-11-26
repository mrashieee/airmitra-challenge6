import type { Profile, Severity } from "./profile";

const SEVERITIES: Severity[] = ["None", "Mild", "Moderate", "Severe"];

function text(value: unknown, max = 60): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function list(value: unknown, maxItems = 8, maxLength = 40): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Server-side allow-list for client-supplied profiles. Keeps prompt context
 * small and prevents unexpected fields from reaching the model.
 */
export function sanitizeProfile(input: unknown): Profile | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const home = raw.home as Record<string, unknown> | undefined;
  const routine = raw.routine as Record<string, unknown> | undefined;
  if (!home || !routine) return null;

  const location = (raw.location ?? {}) as Record<string, unknown>;
  const family = Array.isArray(raw.family) ? raw.family.slice(0, 8) : [];

  return {
    version: 1,
    location: {
      stateCode: text(location.stateCode, 4).toUpperCase() || "DL",
      city: text(location.city, 80) || "New Delhi",
      lat: number(location.lat),
      lon: number(location.lon),
    },
    family: family.map((member, index) => {
      const entry = (member ?? {}) as Record<string, unknown>;
      const severity = text(entry.severity, 12) as Severity;
      return {
        id: text(entry.id, 40) || `member-${index}`,
        relation: text(entry.relation, 40) || "Other",
        ageBand: text(entry.ageBand, 12) || "30-44",
        conditions: list(entry.conditions, 8, 30),
        severity: SEVERITIES.includes(severity) ? severity : "None",
      };
    }),
    home: {
      type: text(home.type, 40) || "Independent",
      cooking: list(home.cooking),
      windows: text(home.windows, 40) || "Mixed",
      cooling: list(home.cooling),
      purifiers: text(home.purifiers, 40) || "None",
      indoorSmoke: list(home.indoorSmoke),
      cleaning: list(home.cleaning),
      cleaningFrequency: text(home.cleaningFrequency, 40) || "Daily",
      pets: Boolean(home.pets),
      plants: Boolean(home.plants),
      carpet: Boolean(home.carpet),
      damp: Boolean(home.damp),
    },
    routine: {
      wake: text(routine.wake, 20) || "6:00 AM",
      sleep: text(routine.sleep, 20) || "10:00 PM",
      work: text(routine.work, 40) || "Office",
      commute: list(routine.commute),
      exercise: text(routine.exercise, 40) || "Morning walk",
      cookingTimes: list(routine.cookingTimes),
    },
    language: text(raw.language, 20) || "English",
    largeText: Boolean(raw.largeText),
    completedAt: text(raw.completedAt, 40),
  };
}
