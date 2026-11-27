"use client";

import { useEffect, useState } from "react";
import { distanceKm } from "@/lib/air/geo";
import {
  MIN_SEARCH_CHARS,
  type CitySuggestion,
  type CrossStateSuggestion,
} from "@/lib/search-types";
import { cn } from "@/lib/ui";
import { SearchIcon } from "./icons";
import { BrandMark } from "./brand-mark";
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
  choiceLabel,
  LANGUAGES as LANGUAGE_OPTIONS,
  t as translate,
} from "@/lib/i18n";
import {
  setThemePreference,
  useThemePreference,
} from "@/lib/theme";
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
  PURIFIERS,
  RELATIONS,
  WINDOW_STATES,
  WORK,
} from "@/lib/profile-options";

type Props = {
  initial?: Profile | null;
  onComplete: (profile: Profile) => void;
  onLanguageChange?: (language: string) => void;
};

const STEPS = [
  "ui.step.location",
  "ui.step.family",
  "ui.step.home",
  "ui.step.routine",
  "ui.step.health",
  "ui.step.finish",
];


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

function LanguageGate({
  value,
  onChange,
  onContinue,
  onEnglish,
}: {
  value: string;
  onChange: (language: string) => void;
  onContinue: () => void;
  onEnglish: () => void;
}) {
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6 pt-5">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8" />
          <div>
            <div className="font-display text-base font-semibold tracking-tight text-ink">
              AirMitra
            </div>
            <div className="text-[10px] text-muted">
              {translate(value, "ui.brand.tagline")}
            </div>
          </div>
        </div>

        <div className="mt-7">
          <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            1 / {STEPS.length + 1} · {translate(value, "ui.onboarding.language")}
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            {translate(value, "ui.onboarding.chooseTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {translate(value, "ui.onboarding.chooseSub")}
          </p>
        </div>

        <div className="mt-5 grid flex-1 grid-cols-2 content-start gap-2 sm:grid-cols-3">
          {LANGUAGE_OPTIONS.map((language) => {
            const active = language.name === value;
            return (
              <button
                key={language.code}
                type="button"
                onClick={() => onChange(language.name)}
                aria-pressed={active}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition",
                  active
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-line bg-card text-ink hover:bg-white",
                )}
              >
                <div className="text-lg font-semibold leading-tight">
                  {language.native}
                </div>
                <div
                  className={cn(
                    "mt-0.5 text-[11px]",
                    active ? "text-white/65" : "text-muted",
                  )}
                >
                  {language.name}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e]"
          >
            {translate(value, "ui.onboarding.continue")}
          </button>
          <button
            type="button"
            onClick={onEnglish}
            className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-white"
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}

export function Onboarding({
  initial,
  onComplete,
  onLanguageChange,
}: Props) {
  const [step, setStep] = useState(0);
  const [languageConfirmed, setLanguageConfirmed] = useState(Boolean(initial));
  const theme = useThemePreference();
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
    if (step !== 0 || query.trim().length >= MIN_SEARCH_CHARS) return;

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
    if (q.length < MIN_SEARCH_CHARS) return;

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
    if (value.trim().length < MIN_SEARCH_CHARS) {
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

  const tr = (key: string, vars?: Record<string, string | number>) =>
    translate(draft.language, key, vars);

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
      setGeoError(tr("ui.onboarding.geoUnsupported"));
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
          setGeoError(tr("ui.onboarding.geoUnreliable"));
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
        else setGeoError(tr("ui.onboarding.geoNoMatch"));
        setLocating(false);
      },
      () => {
        setGeoError(tr("ui.onboarding.geoDenied"));
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

  function addMember(relation: string) {
    setDraft((d) => ({
      ...d,
      family: [
        ...d.family,
        {
          id: uid(),
          relation,
          ageBand: "30-44",
          conditions: [],
          severity: "None",
        },
      ],
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

  if (!languageConfirmed) {
    return (
      <LanguageGate
        value={draft.language}
        onChange={(next) => {
          setDraft((d) => ({ ...d, language: next }));
          onLanguageChange?.(next);
        }}
        onContinue={() => {
          setLanguageConfirmed(true);
          onLanguageChange?.(draft.language);
        }}
        onEnglish={() => {
          setDraft((d) => ({ ...d, language: "English" }));
          onLanguageChange?.("English");
          setLanguageConfirmed(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <div>
              <div className="font-display text-base font-semibold tracking-tight text-ink">
                AirMitra
              </div>
              <div className="text-[10px] text-muted">
                {translate(draft.language, "ui.brand.tagline")}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-[11px] font-medium text-muted underline-offset-4 hover:underline"
          >
            {translate(draft.language, "ui.onboarding.skip")}
          </button>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>
              {translate(draft.language, "ui.onboarding.step", {
                n: step + 2,
                total: STEPS.length + 1,
              })}
            </span>
            <span>{translate(draft.language, STEPS[step])}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${((step + 2) / (STEPS.length + 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-5 flex-1 rounded-3xl bg-card p-5 ring-1 ring-black/5">
          {step === 0 ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.whereTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.whereSub")}
                </p>
              </div>

              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e] disabled:opacity-60"
              >
                {locating
                  ? translate(draft.language, "ui.onboarding.finding")
                  : translate(draft.language, "ui.onboarding.useLocation")}
              </button>
              {geoError ? (
                <p className="text-xs leading-5 text-red-700">{geoError}</p>
              ) : null}
              {geoAccuracy !== null && geoAccuracy > 1000 ? (
                <p className="text-xs leading-5 text-amber-700">
                  {tr("ui.onboarding.accuracy", {
                    km: (geoAccuracy / 1000).toFixed(1),
                  })}
                </p>
              ) : null}

              <div className="space-y-3">
                <div>
                  <Label>{translate(draft.language, "ui.onboarding.stateLabel")}</Label>
                  <Select
                    ariaLabel={translate(draft.language, "ui.onboarding.stateLabel")}
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
                <Label>
                  {translate(draft.language, "ui.onboarding.searchIn", {
                    state: state.name,
                  })}
                </Label>
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    placeholder={translate(
                      draft.language,
                      "ui.onboarding.searchPlaceholder",
                      { state: state.name },
                    )}
                    className="w-full appearance-none rounded-xl border border-line bg-paper py-2.5 pl-10 pr-3 text-sm text-ink outline-none placeholder:text-muted"
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  {translate(draft.language, "ui.onboarding.searchHint", {
                    state: state.name,
                  })}
                </p>
                {query.trim().length > 0 &&
                query.trim().length < MIN_SEARCH_CHARS ? (
                  <p className="mt-1 text-[10px] text-muted">
                    {translate(draft.language, "ui.onboarding.typeMore", {
                      n: MIN_SEARCH_CHARS,
                    })}
                  </p>
                ) : null}
                {searching ? (
                  <p className="mt-2 text-[11px] text-muted">
                    {translate(draft.language, "ui.onboarding.searching")}
                  </p>
                ) : null}
                {!searching && query.trim().length >= MIN_SEARCH_CHARS && results.length === 0 ? (
                  <p className="mt-2 text-[11px] text-muted">
                    {translate(draft.language, "ui.onboarding.noPlace", {
                      state: state.name,
                    })}
                  </p>
                ) : null}
                {!searching && crossState.length ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      {translate(draft.language, "ui.onboarding.crossState")}
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
                    {translate(draft.language, "ui.onboarding.modelNote")}
                  </p>
                ) : null}
                {results.length ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-line">
                    {results.slice(0, 6).map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        aria-label={tr(
                          result.monitor
                            ? "ui.search.ground"
                            : "ui.search.model",
                          { place: result.name },
                        )}
                        onClick={() => setSearchedLocation(result)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-paper"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{result.name}</span>
                          {result.near || result.admin2 ? (
                            <span className="block truncate text-[9px] text-muted">
                              {tr("ui.search.near", {
                                place: result.near ?? result.admin2 ?? "",
                              })}
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1",
                            result.monitor
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200",
                          )}
                        >
                          {result.monitor
                            ? tr("ui.hero.ground")
                            : tr("ui.hero.modelOnly")}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {!searching && !query.trim() && suggestions.length ? (
                  <div className="mt-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      {translate(draft.language, "ui.onboarding.popularIn", {
                        state: state.name,
                      })}
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
                {translate(draft.language, "ui.onboarding.watching", {
                  city: draft.location.city,
                  state: state.name,
                })}
                <p className="mt-1 text-[10px]">
                  {translate(draft.language, "ui.onboarding.detected")}
                </p>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.familyTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.familySub")}
                </p>
              </div>

              <div className="space-y-3">
                {draft.family.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-line p-4 text-center">
                    <p className="text-sm font-medium text-ink">
                      {tr("ui.onboarding.cardEmptyTitle")}
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-muted">
                      {tr("ui.onboarding.cardEmptyBody")}
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => addMember("You")}
                        className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-medium text-white"
                      >
                        {tr("ui.editor.addYourself")}
                      </button>
                      <button
                        type="button"
                        onClick={() => addMember("Other")}
                        className="rounded-full bg-card px-3 py-1.5 text-[11px] font-medium text-ink ring-1 ring-line"
                      >
                        {tr("ui.onboarding.addFamily")}
                      </button>
                    </div>
                  </div>
                ) : null}
                {draft.family.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-line p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        ariaLabel={tr("ui.editor.relation")}
                        value={member.relation}
                        onChange={(v) => updateMember(member.id, { relation: v })}
                        options={RELATIONS.map((r) => ({
                          value: r,
                          label: choiceLabel(draft.language, r),
                        }))}
                      />
                      <Select
                        ariaLabel={tr("ui.editor.ageGroup")}
                        value={member.ageBand}
                        onChange={(v) => updateMember(member.id, { ageBand: v })}
                        options={AGE_BANDS.map((a) => ({
                          value: a,
                          label: choiceLabel(draft.language, a),
                        }))}
                      />
                    </div>
                    <div className="mt-3">
                      <Label>{tr("ui.editor.conditions")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((c) => (
                          <Chip
                            key={c}
                            active={member.conditions.includes(c)}
                            onClick={() => toggleCondition(member.id, c)}
                          >
                            {choiceLabel(draft.language, c)}
                          </Chip>
                        ))}
                        <Chip
                          active={member.conditions.length === 0}
                          onClick={() => updateMember(member.id, { conditions: [] })}
                        >
                          {choiceLabel(draft.language, "None")}
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
                        {tr("ui.editor.remove")}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {draft.family.length < 4 ? (
                <button
                  type="button"
                  onClick={() => addMember("Other")}
                  className="w-full rounded-xl border border-dashed border-line px-3 py-2.5 text-xs font-medium text-muted hover:bg-paper"
                >
                  {tr("ui.editor.addAnother")}
                </button>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.homeTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.homeSub")}
                </p>
              </div>

              <div>
                <Label>{tr("ui.editor.homeType")}</Label>
                <div className="flex flex-wrap gap-2">
                  {HOME_TYPES.map(
                    (v) => (
                      <Chip
                        key={v}
                        active={draft.home.type === v}
                        onClick={() => setHome({ type: v })}
                      >
                        {choiceLabel(draft.language, v)}
                      </Chip>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.cooking")}</Label>
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
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.windows")}</Label>
                <div className="flex flex-wrap gap-2">
                  {WINDOW_STATES.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.windows === v}
                      onClick={() => setHome({ windows: v })}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.cooling")}</Label>
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
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.purifier")}</Label>
                <div className="flex flex-wrap gap-2">
                  {PURIFIERS.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.purifiers === v}
                      onClick={() => setHome({ purifiers: v })}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.smoke")}</Label>
                <div className="flex flex-wrap gap-2">
                  {INDOOR_SMOKE.map(
                    (v) => (
                      <Chip
                        key={v}
                        active={draft.home.indoorSmoke.includes(v)}
                        onClick={() => toggleSmoke(v)}
                      >
                        {choiceLabel(draft.language, v)}
                      </Chip>
                    ),
                  )}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.cleaning")}</Label>
                <div className="flex flex-wrap gap-2">
                  {CLEANING_METHODS.map((v) => (
                    <Chip
                      key={v}
                      active={draft.home.cleaning.includes(v)}
                      onClick={() => toggleCleaning(v)}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
                <div className="mt-3">
                  <Label>{tr("ui.editor.howOften")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {CLEANING_FREQUENCIES.map((v) => (
                      <Chip
                        key={v}
                        active={draft.home.cleaningFrequency === v}
                        onClick={() => setHome({ cleaningFrequency: v })}
                      >
                        {choiceLabel(draft.language, v)}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.alsoHome")}</Label>
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
                      {choiceLabel(draft.language, label)}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.routineTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.routineSub")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{tr("ui.editor.wake")}</Label>
                  <Select
                    ariaLabel={tr("ui.editor.wake")}
                    value={draft.routine.wake}
                    onChange={(v) => setRoutine({ wake: v })}
                    options={["5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"].map(
                      (v) => ({ value: v, label: v }),
                    )}
                  />
                </div>
                <div>
                  <Label>{tr("ui.editor.sleep")}</Label>
                  <Select
                    ariaLabel={tr("ui.editor.sleep")}
                    value={draft.routine.sleep}
                    onChange={(v) => setRoutine({ sleep: v })}
                    options={["9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"].map(
                      (v) => ({ value: v, label: v }),
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.work")}</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.work === v}
                      onClick={() => setRoutine({ work: v })}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.commute")}</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMUTES.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.commute.includes(v)}
                      onClick={() => toggleCommute(v)}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.exercise")}</Label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE.map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.exercise === v}
                      onClick={() => setRoutine({ exercise: v })}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>{tr("ui.editor.cookingTimes")}</Label>
                <div className="flex flex-wrap gap-2">
                  {["Morning", "Afternoon", "Evening"].map((v) => (
                    <Chip
                      key={v}
                      active={draft.routine.cookingTimes.includes(v)}
                      onClick={() => toggleCooking(v)}
                    >
                      {choiceLabel(draft.language, v)}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.healthTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.healthSub")}
                </p>
              </div>

              {draft.family.filter((m) => m.conditions.length > 0).length === 0 ? (
                <div className="rounded-xl bg-paper p-3 text-xs leading-5 text-muted ring-1 ring-line">
                  {tr("ui.onboarding.noConditions")}
                </div>
              ) : null}

              <div className="space-y-3">
                {draft.family
                  .filter((m) => m.conditions.length > 0)
                  .map((member) => (
                    <div key={member.id} className="rounded-2xl border border-line p-3">
                      <div className="text-sm font-semibold text-ink">
                        {choiceLabel(draft.language, member.relation)} ·{" "}
                        {choiceLabel(draft.language, member.ageBand)}
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        {member.conditions
                          .map((condition) =>
                            choiceLabel(draft.language, condition),
                          )
                          .join(" · ")}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Mild", "Moderate", "Severe"] as Severity[]).map((s) => (
                          <Chip
                            key={s}
                            active={member.severity === s}
                            onClick={() => updateMember(member.id, { severity: s })}
                          >
                            {choiceLabel(draft.language, s)}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {translate(draft.language, "ui.onboarding.accessTitle")}
                </h1>
                <p className="mt-1 text-xs leading-5 text-muted">
                  {translate(draft.language, "ui.onboarding.accessSub")}
                </p>
              </div>

              <div>
                <Label>{translate(draft.language, "ui.settings.textSize")}</Label>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={!draft.largeText}
                    onClick={() => setDraft((d) => ({ ...d, largeText: false }))}
                  >
                    {translate(draft.language, "ui.settings.normal")}
                  </Chip>
                  <Chip
                    active={draft.largeText}
                    onClick={() => setDraft((d) => ({ ...d, largeText: true }))}
                  >
                    {translate(draft.language, "ui.settings.larger")}
                  </Chip>
                </div>
              </div>

              <div>
                <Label>{translate(draft.language, "ui.settings.appearance")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setThemePreference(option)}
                      aria-pressed={theme === option}
                      className={cn(
                        "rounded-xl px-2 py-2.5 text-xs font-medium ring-1 transition",
                        theme === option
                          ? "bg-brand text-white ring-brand"
                          : "bg-paper text-ink ring-line hover:bg-white",
                      )}
                    >
                      {option === "light"
                        ? translate(draft.language, "ui.settings.light")
                        : option === "dark"
                          ? translate(draft.language, "ui.settings.dark")
                          : translate(draft.language, "ui.settings.system")}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-4 text-muted">
                  {translate(draft.language, "ui.settings.appearanceHint")}
                </p>
              </div>

              <div className="rounded-xl bg-paper p-3 text-xs leading-5 text-muted ring-1 ring-line">
                <div className="font-medium text-ink">
                  {draft.location.city}, {findState(draft.location.stateCode).name}
                </div>
                <div className="mt-1">
                  {draft.family.length}{" "}
                  {draft.family.length === 1 ? "person" : "people"} ·{" "}
                  {draft.language}
                </div>
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
              {translate(draft.language, "ui.onboarding.back")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (canNext ? setStep((s) => s + 1) : finish())}
            className="flex-1 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e]"
          >
            {canNext
              ? translate(draft.language, "ui.onboarding.next")
              : translate(draft.language, "ui.onboarding.finish")}
          </button>
        </div>
      </div>
    </div>
  );
}
