"use client";

import { useEffect, useState } from "react";
import { distanceKm } from "@/lib/air/geo";
import type {
  CitySuggestion,
  CrossStateSuggestion,
} from "@/lib/search-types";
import { cn } from "@/lib/ui";
import { SearchIcon } from "./icons";
import {
  ALL_STATES,
  citiesFor,
  findCity,
  findState,
  STATES,
  UNION_TERRITORIES,
} from "@/lib/states";
import {
  createDefaultProfile,
  type FamilyMember,
  type HomeProfile,
  type Profile,
  type RoutineProfile,
  type Severity,
} from "@/lib/profile";
import {
  AGE_BANDS,
  CLEANING_FREQUENCIES,
  CLEANING_METHODS,
  CONDITIONS,
  COOKING_FUELS,
  COOLING,
  COMMUTES,
  EXERCISE,
  HOME_TYPES,
  INDOOR_SMOKE,
  LANGUAGES,
  PURIFIERS,
  RELATIONS,
  WINDOW_STATES,
  WORK,
} from "@/lib/profile-options";

type Props = {
  initial?: Profile | null;
  onComplete: (profile: Profile) => void;
};

const STEPS = ["Location", "Family", "Home", "Routine", "Health", "Finish"];


function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function nearestPlace(lat: number, lon: number) {
  let best: { stateCode: string; city: string; distance: number } | null = null;

  for (const state of ALL_STATES) {
    for (const city of citiesFor(state.code)) {
      const d = distanceKm({ lat, lon }, { lat: city.lat, lon: city.lon });
      if (!best || d < best.distance) {
        best = { stateCode: state.code, city: city.name, distance: d };
      }
    }
  }

  return best && best.distance < 250 ? best : null;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-xs font-medium ring-1 transition ${
        active
          ? "bg-ink text-white ring-ink"
          : "bg-paper text-ink ring-line hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Onboarding({ initial, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(initial ?? createDefaultProfile());
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [geoAccuracy, setGeoAccuracy] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [fromGeocode, setFromGeocode] = useState(false);
  const [crossState, setCrossState] = useState<CrossStateSuggestion[]>([]);

  // Popular, station-backed places for the selected state (no typing needed).
  useEffect(() => {
    if (step !== 0 || query.trim().length >= 2) return;

    const controller = new AbortController();
    fetch(
      `/api/search?state=${encodeURIComponent(draft.location.stateCode)}&limit=6`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data: { results?: CitySuggestion[] }) => {
        if (!controller.signal.aborted) setSuggestions(data.results ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSuggestions([]);
      });

    return () => controller.abort();
  }, [step, query, draft.location.stateCode]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(
        `/api/search?q=${encodeURIComponent(q)}&state=${encodeURIComponent(
          draft.location.stateCode,
        )}`,
        { signal: controller.signal },
      )
        .then((res) => res.json())
        .then(
          (data: {
            results?: CitySuggestion[];
            crossState?: CrossStateSuggestion[];
            fallback?: string | null;
          }) => {
            setResults(data.results ?? []);
            setCrossState(data.crossState ?? []);
            setFromGeocode(data.fallback === "geocode");
          },
        )
        .catch((reason: unknown) => {
          if (!(reason instanceof DOMException && reason.name === "AbortError")) {
            setResults([]);
            setCrossState([]);
            setFromGeocode(false);
          }
        })
        .finally(() => setSearching(false));
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, draft.location.stateCode]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setCrossState([]);
      setFromGeocode(false);
      setSearching(false);
    }
  }

  function setSearchedLocation(result: CitySuggestion, stateCode?: string) {
    setDraft((d) => ({
      ...d,
      location: {
        stateCode: stateCode ?? d.location.stateCode,
        city: result.name,
        lat: result.latitude,
        lon: result.longitude,
      },
    }));
    setQuery("");
    setResults([]);
    setCrossState([]);
  }

  const state = findState(draft.location.stateCode);

  function setLocation(stateCode: string, cityName: string) {
    const city = findCity(stateCode, cityName);
    if (!city) return;
    setDraft((d) => ({
      ...d,
      location: {
        stateCode,
        city: city.name,
        lat: city.lat,
        lon: city.lon,
      },
    }));
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Location is not supported here. Pick your state and city.");
      return;
    }

    setLocating(true);
    setGeoError("");
    setGeoAccuracy(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = position.coords.accuracy ?? Number.POSITIVE_INFINITY;

        // A phone GPS is usually < 100 m. Anything above 15 km is a network/IP
        // guess and would put the user in the wrong district or state.
        if (!Number.isFinite(accuracy) || accuracy > 15000) {
          setGeoAccuracy(null);
          setGeoError(
            "Couldn't get a reliable location. Search for your town above instead.",
          );
          setLocating(false);
          return;
        }

        setGeoAccuracy(accuracy);

        try {
          const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = (await res.json()) as {
              name: string;
              stateCode: string;
              lat: number;
              lon: number;
            };
            setDraft((d) => ({
              ...d,
              location: {
                stateCode: data.stateCode,
                city: data.name,
                lat: data.lat,
                lon: data.lon,
              },
            }));
            setLocating(false);
            return;
          }
        } catch {
          /* fall back to nearest city */
        }

        const place = nearestPlace(lat, lon);
        if (place) setLocation(place.stateCode, place.city);
        else setGeoError("Could not match your location. Pick manually.");
        setLocating(false);
      },
      () => {
        setGeoError("Location permission denied. Pick manually.");
        setLocating(false);
      },
      { timeout: 15000, maximumAge: 0, enableHighAccuracy: true },
    );
  }

  function updateMember(id: string, patch: Partial<FamilyMember>) {
    setDraft((d) => ({
      ...d,
      family: d.family.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function toggleCondition(id: string, condition: string) {
    setDraft((d) => ({
      ...d,
      family: d.family.map((m) => {
        if (m.id !== id) return m;
        const has = m.conditions.includes(condition);
        return {
          ...m,
          conditions: has
            ? m.conditions.filter((c) => c !== condition)
            : [...m.conditions, condition],
          severity: has && m.conditions.length === 1 ? "None" : m.severity,
        };
      }),
    }));
  }

  function setHome(patch: Partial<HomeProfile>) {
    setDraft((d) => ({ ...d, home: { ...d.home, ...patch } }));
  }

  function setRoutine(patch: Partial<RoutineProfile>) {
    setDraft((d) => ({ ...d, routine: { ...d.routine, ...patch } }));
  }

  function toggleCookingFuel(value: string) {
    setDraft((d) => {
      if (value === "None") {
        return { ...d, home: { ...d.home, cooking: ["None"] } };
      }
      const withoutNone = d.home.cooking.filter((v) => v !== "None");
      const has = withoutNone.includes(value);
      return {
        ...d,
        home: {
          ...d.home,
          cooking: has
            ? withoutNone.filter((v) => v !== value)
            : [...withoutNone, value],
        },
      };
    });
  }

  function toggleCooling(value: string) {
    setDraft((d) => {
      if (value === "None") {
        return { ...d, home: { ...d.home, cooling: ["None"] } };
      }
      const withoutNone = d.home.cooling.filter((v) => v !== "None");
      const has = withoutNone.includes(value);
      return {
        ...d,
        home: {
          ...d.home,
          cooling: has
            ? withoutNone.filter((v) => v !== value)
            : [...withoutNone, value],
        },
      };
    });
  }

  function toggleCommute(value: string) {
    setDraft((d) => {
      const has = d.routine.commute.includes(value);
      return {
        ...d,
        routine: {
          ...d.routine,
          commute: has
            ? d.routine.commute.filter((v) => v !== value)
            : [...d.routine.commute, value],
        },
      };
    });
  }

  function toggleCleaning(value: string) {
    setDraft((d) => {
      const has = d.home.cleaning.includes(value);
      return {
        ...d,
        home: {
          ...d.home,
          cleaning: has
            ? d.home.cleaning.filter((v) => v !== value)
            : [...d.home.cleaning, value],
        },
      };
    });
  }

  function toggleSmoke(value: string) {
    setDraft((d) => {
      const has = d.home.indoorSmoke.includes(value);
      return {
        ...d,
        home: {
          ...d.home,
          indoorSmoke: has
            ? d.home.indoorSmoke.filter((v) => v !== value)
            : [...d.home.indoorSmoke, value],
        },
      };
    });
  }

  function toggleCooking(value: string) {
    setDraft((d) => {
      const has = d.routine.cookingTimes.includes(value);
      return {
        ...d,
        routine: {
          ...d.routine,
          cookingTimes: has
            ? d.routine.cookingTimes.filter((v) => v !== value)
            : [...d.routine.cookingTimes, value],
        },
      };
    });
  }

  function finish() {
    onComplete({ ...draft, completedAt: new Date().toISOString() });
  }

  const canNext = step < STEPS.length - 1;

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight text-ink">AirMitra</div>
            <div className="text-[10px] text-muted">Household Air Coach</div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-[11px] font-medium text-muted underline-offset-4 hover:underline"
          >
            Skip for now
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex-1 rounded-3xl bg-card p-5 ring-1 ring-black/5">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  Where should I watch the air?
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Use your location, or pick a state and city. You can change this later.
                </p>
              </div>

              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {locating ? "Finding you…" : "Use my location"}
              </button>
              {geoError ? (
                <p className="text-xs leading-5 text-red-700">{geoError}</p>
              ) : null}
              {geoAccuracy !== null && geoAccuracy > 1000 ? (
                <p className="text-xs leading-5 text-amber-700">
                  Your device location is approximate (±
                  {(geoAccuracy / 1000).toFixed(1)} km). Search your town above
                  for accuracy.
                </p>
              ) : null}

              <div className="space-y-3">
                <div>
                  <Label>State or union territory</Label>
                  <Select
                    ariaLabel="State or union territory"
                    value={draft.location.stateCode}
                    onChange={(code) => setLocation(code, citiesFor(code)[0].name)}
                    options={[
                      ...STATES.map((s) => ({ value: s.code, label: s.name })),
                      ...UNION_TERRITORIES.map((s) => ({
                        value: s.code,
                        label: s.name,
                      })),
                    ]}
                  />
                </div>
              </div>

              <div>
                <Label>Search in {state.name}</Label>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder={`Town or city in ${state.name}`}
                    className="w-full appearance-none rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  Searches {state.name} only. Places with a ground monitor are
                  listed first.
                </p>
                {searching ? (
                  <p className="mt-2 text-[11px] text-muted">Searching…</p>
                ) : null}
                {!searching && query.trim().length >= 2 && results.length === 0 ? (
                  <p className="mt-2 text-[11px] text-muted">
                    No place found in {state.name}.
                  </p>
                ) : null}
                {!searching && crossState.length ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      Found in another state
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {crossState.map((place) => (
                        <button
                          key={`${place.stateCode}-${place.name}`}
                          type="button"
                          onClick={() => setSearchedLocation(place, place.stateCode)}
                          className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-ink ring-1 ring-line transition hover:bg-white"
                        >
                          {place.name}
                          <span className="ml-1 text-[9px] text-muted">
                            {place.stateName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {fromGeocode && results.length ? (
                  <p className="mt-2 text-[10px] leading-4 text-muted">
                    No monitored city matched. These results use the CAMS model,
                    not a ground station.
                  </p>
                ) : null}
                {results.length ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-line">
                    {results.slice(0, 6).map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        aria-label={`${result.name}${result.monitor ? ", ground monitor available" : ", model estimate only"}`}
                        onClick={() => setSearchedLocation(result)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-paper"
                      >
                        <span className="truncate">{result.name}</span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1",
                            result.monitor
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200",
                          )}
                        >
                          {result.monitor ? "ground monitor" : "model only"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {!searching && !query.trim() && suggestions.length ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      Popular in {state.name}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => setSearchedLocation(suggestion)}
                          className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink ring-1 ring-line transition hover:bg-white"
                        >
                          {suggestion.name}
                          {suggestion.monitor ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-paper p-3 text-xs leading-5 text-muted ring-1 ring-line">
                Watching <span className="font-medium text-ink">{draft.location.city}</span>,{" "}
                {state.name}. A ground monitor is used when one is nearby;
                otherwise CAMS model data, labelled clearly.
                <p className="mt-1 text-[10px]">
                  Detected from your device. Not right? Search for your town
                  above.
                </p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  Who do you care for?
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Add the people whose air you manage. This changes the advice.
                </p>
              </div>

              <div className="space-y-3">
                {draft.family.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-line p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        ariaLabel="Relation"
                        value={member.relation}
                        onChange={(v) => updateMember(member.id, { relation: v })}
                        options={RELATIONS.map((r) => ({ value: r, label: r }))}
                      />
                      <Select
                        ariaLabel="Age band"
                        value={member.ageBand}
                        onChange={(v) => updateMember(member.id, { ageBand: v })}
                        options={AGE_BANDS.map((a) => ({ value: a, label: a }))}
                      />
                    </div>
                    <div className="mt-3">
                      <Label>Conditions</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((c) => (
                          <Chip
                            key={c}
                            active={member.conditions.includes(c)}
                            onClick={() => toggleCondition(member.id, c)}
                          >
                            {c}
                          </Chip>
                        ))}
                        <Chip
                          active={member.conditions.length === 0}
                          onClick={() => updateMember(member.id, { conditions: [] })}
                        >
                          None
                        </Chip>
                      </div>
                    </div>
                    {draft.family.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            family: d.family.filter((m) => m.id !== member.id),
                          }))
                        }
                        className="mt-3 text-[11px] font-medium text-muted hover:text-red-700"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {draft.family.length < 4 ? (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      family: [
                        ...d.family,
                        {
                          id: uid(),
                          relation: "Other",
                          ageBand: "19-29",
                          conditions: [],
                          severity: "None",
                        },
                      ],
                    }))
                  }
                  className="w-full rounded-xl border border-dashed border-line px-3 py-2.5 text-xs font-medium text-muted hover:bg-paper"
                >
                  + Add another person
                </button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  What does your home have?
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  We use this to suggest fixes you can actually do.
                </p>
              </div>

              <div>
                <Label>Home type</Label>
                <div className="flex flex-wrap gap-2">
                  {HOME_TYPES.map(
                    (v) => (
                      <Chip
                        key={v}
                        active={draft.home.type === v}
                        onClick={() => setHome({ type: v })}
                      >
                        {v}
                      </Chip>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label>Cooking</Label>
                <div className="flex flex-wrap gap-2">
                  {COOKING_FUELS.map((v) => (
                    <Chip
                      key={v}
                      active={
                        draft.home.cooking.includes(v) ||
                        (v === "None" && draft.home.cooking.length === 0)
                      }
                      onClick={() => toggleCookingFuel(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Windows</Label>
                <div className="flex flex-wrap gap-2">
                  {WINDOW_STATES.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.windows === v}
                      onClick={() => setHome({ windows: v })}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cooling</Label>
                <div className="flex flex-wrap gap-2">
                  {COOLING.map((v) => (
                    <Chip
                      key={v}
                      active={
                        draft.home.cooling.includes(v) ||
                        (v === "None" && draft.home.cooling.length === 0)
                      }
                      onClick={() => toggleCooling(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Air purifier</Label>
                <div className="flex flex-wrap gap-2">
                  {PURIFIERS.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.purifiers === v}
                      onClick={() => setHome({ purifiers: v })}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Indoor smoke</Label>
                <div className="flex flex-wrap gap-2">
                  {INDOOR_SMOKE.map(
                    (v) => (
                      <Chip
                        key={v}
                        active={draft.home.indoorSmoke.includes(v)}
                        onClick={() => toggleSmoke(v)}
                      >
                        {v}
                      </Chip>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label>Cleaning methods</Label>
                <div className="flex flex-wrap gap-2">
                  {CLEANING_METHODS.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.cleaning.includes(v)}
                      onClick={() => toggleCleaning(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
                <div className="mt-3">
                  <Label>How often?</Label>
                  <div className="flex flex-wrap gap-2">
                    {CLEANING_FREQUENCIES.map((v) => (
                      <Chip
                        key={v}
                        active={draft.home.cleaningFrequency === v}
                        onClick={() => setHome({ cleaningFrequency: v })}
                      >
                        {v}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Also at home</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["Pets", "pets"],
                    ["Indoor plants", "plants"],
                    ["Carpet", "carpet"],
                    ["Dampness/mold", "damp"],
                  ].map(([label, key]) => (
                    <Chip
                      key={key}
                      active={Boolean(draft.home[key as keyof HomeProfile])}
                      onClick={() =>
                        setHome({
                          [key]: !draft.home[key as keyof HomeProfile],
                        } as Partial<HomeProfile>)
                      }
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  What does your day look like?
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  We time advice around your routine, not the other way round.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Wake</Label>
                  <Select
                    ariaLabel="Wake time"
                    value={draft.routine.wake}
                    onChange={(v) => setRoutine({ wake: v })}
                    options={["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"].map(
                      (v) => ({ value: v, label: v }),
                    )}
                  />
                </div>
                <div>
                  <Label>Sleep</Label>
                  <Select
                    ariaLabel="Sleep time"
                    value={draft.routine.sleep}
                    onChange={(v) => setRoutine({ sleep: v })}
                    options={["9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"].map(
                      (v) => ({ value: v, label: v }),
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>Work</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.work === v}
                      onClick={() => setRoutine({ work: v })}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Commute</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMUTES.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.commute.includes(v)}
                      onClick={() => toggleCommute(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Outdoor exercise</Label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.exercise === v}
                      onClick={() => setRoutine({ exercise: v })}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Cooking times</Label>
                <div className="flex flex-wrap gap-2">
                  {["Morning", "Afternoon", "Evening"].map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.cookingTimes.includes(v)}
                      onClick={() => toggleCooking(v)}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  How sensitive is each person?
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Optional. It tightens the thresholds. This is not a diagnosis.
                </p>
              </div>

              {draft.family.filter((m) => m.conditions.length > 0).length === 0 ? (
                <div className="rounded-xl bg-paper p-3 text-xs leading-5 text-muted ring-1 ring-line">
                  No conditions added. You can skip this step.
                </div>
              ) : null}

              <div className="space-y-3">
                {draft.family
                  .filter((m) => m.conditions.length > 0)
                  .map((member) => (
                    <div key={member.id} className="rounded-2xl border border-line p-3">
                      <div className="text-sm font-semibold text-ink">
                        {member.relation} · {member.ageBand}
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {member.conditions.join(" · ")}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Mild", "Moderate", "Severe"] as Severity[]).map((s) => (
                          <Chip
                            key={s}
                            active={member.severity === s}
                            onClick={() => updateMember(member.id, { severity: s })}
                          >
                            {s}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  You&apos;re set.
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  UI is English for now. Pick a preferred language for generated
                  advice later.
                </p>
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  ariaLabel="Language"
                  value={draft.language}
                  onChange={(v) => setDraft((d) => ({ ...d, language: v }))}
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                />
              </div>

              <div>
                <Label>Text size</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={!draft.largeText}
                    onClick={() => setDraft((d) => ({ ...d, largeText: false }))}
                  >
                    Normal
                  </Chip>
                  <Chip
                    active={draft.largeText}
                    onClick={() => setDraft((d) => ({ ...d, largeText: true }))}
                  >
                    Larger
                  </Chip>
                </div>
              </div>

              <div className="rounded-xl bg-paper p-3 text-xs leading-5 text-muted ring-1 ring-line">
                <div className="font-medium text-ink">Summary</div>
                <div className="mt-1">
                  {draft.location.city}, {findState(draft.location.stateCode).name}
                </div>
                <div>
                  {draft.family.length} {draft.family.length === 1 ? "person" : "people"} ·
                  purifier: {draft.home.purifiers} · cooking: {draft.home.cooking.join(", ") || "None"}
                </div>
                <div>{draft.language} · {draft.largeText ? "larger text" : "normal text"}</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-white"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (canNext ? setStep((s) => s + 1) : finish())}
            className="flex-1 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {canNext ? "Continue" : "Finish setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
