import { findCity } from "./states";

export type Severity = "Mild" | "Moderate" | "Severe" | "None";

export type FamilyMember = {
  id: string;
  relation: string;
  ageBand: string;
  conditions: string[];
  severity: Severity;
};

export type HomeProfile = {
  type: string;
  cooking: string[];
  windows: string;
  cooling: string[];
  purifiers: string;
  indoorSmoke: string[];
  cleaning: string[];
  cleaningFrequency: string;
  pets: boolean;
  plants: boolean;
  carpet: boolean;
  damp: boolean;
};

export type RoutineProfile = {
  wake: string;
  sleep: string;
  work: string;
  commute: string[];
  exercise: string;
  cookingTimes: string[];
};

export type Profile = {
  version: 1;
  location: {
    stateCode: string;
    city: string;
    lat: number;
    lon: number;
  };
  family: FamilyMember[];
  home: HomeProfile;
  routine: RoutineProfile;
  language: string;
  largeText: boolean;
  completedAt: string;
};

const KEY = "airmitra.profile.v1";
const EVENT = "airmitra-profile";

export function createDefaultProfile(): Profile {
  const city = findCity("DL", "New Delhi")!;

  return {
    version: 1,
    location: {
      stateCode: "DL",
      city: city.name,
      lat: city.lat,
      lon: city.lon,
    },
    family: [
      {
        id: "father",
        relation: "Father",
        ageBand: "60-74",
        conditions: ["Asthma"],
        severity: "Moderate",
      },
      {
        id: "daughter",
        relation: "Daughter",
        ageBand: "6-12",
        conditions: [],
        severity: "None",
      },
    ],
    home: {
      type: "Apartment",
      cooking: ["LPG"],
      windows: "Mostly closed",
      cooling: ["Fans only"],
      purifiers: "None",
      indoorSmoke: ["Agarbatti"],
      cleaning: ["Dry sweeping"],
      cleaningFrequency: "2-3x/week",
      pets: false,
      plants: true,
      carpet: false,
      damp: false,
    },
    routine: {
      wake: "6:00 AM",
      sleep: "10:00 PM",
      work: "Office",
      commute: ["Metro"],
      exercise: "Morning walk",
      cookingTimes: ["Morning", "Evening"],
    },
    language: "English",
    largeText: false,
    completedAt: "",
  };
}

export function parseProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Profile;
    if (parsed?.version !== 1 || !parsed.location || !parsed.family) {
      return null;
    }

    // Migrate older single-choice cooking/cooling/cleaning values.
    const home = parsed.home as unknown as Record<string, unknown>;
    if (typeof home.cooking === "string") home.cooking = [home.cooking];
    if (typeof home.cooling === "string") home.cooling = [home.cooling];
    if (typeof home.cleaning === "string") home.cleaning = [home.cleaning];
    if (!Array.isArray(home.cooking)) home.cooking = ["LPG"];
    if (!Array.isArray(home.cooling)) home.cooling = ["Fans only"];
    if (!Array.isArray(home.cleaning)) home.cleaning = ["Dry sweeping"];
    if (typeof home.cleaningFrequency !== "string") {
      home.cleaningFrequency = "2-3x/week";
    }

    const routine = parsed.routine as unknown as Record<string, unknown>;
    if (typeof routine.commute === "string") {
      const value = routine.commute;
      routine.commute =
        value === "Mixed" ? ["Bus", "Metro"] : value === "None" ? [] : [value];
    }
    if (!Array.isArray(routine.commute)) routine.commute = ["Metro"];
    // Retired field: school-run relevance is inferred from children in the family.
    delete (routine as { schoolRun?: unknown }).schoolRun;

    // Older age bands -> the wider, more granular set.
    const legacyAge: Record<string, string> = {
      "0-5": "2-5",
      "19-59": "30-44",
      "60+": "60-74",
    };
    parsed.family = parsed.family.map((member) => ({
      ...member,
      ageBand: legacyAge[member.ageBand] ?? member.ageBand,
      conditions: Array.isArray(member.conditions) ? member.conditions : [],
    }));

    return parsed;
  } catch {
    return null;
  }
}

export function subscribeProfile(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getProfileSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getServerProfileSnapshot(): null {
  return null;
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(EVENT));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}
