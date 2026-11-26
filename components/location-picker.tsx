"use client";

import { useEffect, useState } from "react";
import {
  MIN_SEARCH_CHARS,
  type CitySuggestion,
  type CrossStateSuggestion,
} from "@/lib/search-types";
import { findState, STATES, UNION_TERRITORIES } from "@/lib/states";
import { cn } from "@/lib/ui";
import { PinIcon, SearchIcon } from "./icons";

export function LocationSelect({
  code,
  onStateChange,
  onSelectLocation,
  compact = false,
}: {
  code: string;
  onStateChange: (v: string) => void;
  onSelectLocation: (loc: {
    stateCode: string;
    city: string;
    lat: number;
    lon: number;
  }) => void;
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [crossState, setCrossState] = useState<CrossStateSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const stateName = findState(code).name;

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_SEARCH_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(
        `/api/search?q=${encodeURIComponent(q)}&state=${encodeURIComponent(code)}`,
        { signal: controller.signal },
      )
        .then((res) => res.json())
        .then(
          (data: {
            results?: CitySuggestion[];
            crossState?: CrossStateSuggestion[];
          }) => {
            setResults(data.results ?? []);
            setCrossState(data.crossState ?? []);
          },
        )
        .catch((reason: unknown) => {
          if (!(reason instanceof DOMException && reason.name === "AbortError")) {
            setResults([]);
            setCrossState([]);
          }
        })
        .finally(() => setSearching(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, code]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length < MIN_SEARCH_CHARS) {
      setResults([]);
      setCrossState([]);
      setSearching(false);
    }
  }

  function choose(result: CitySuggestion, stateCode?: string) {
    onSelectLocation({
      stateCode: stateCode ?? code,
      city: result.name,
      lat: result.latitude,
      lon: result.longitude,
    });
    setQuery("");
    setResults([]);
    setCrossState([]);
  }

  return (
    <div className={cn("space-y-2", compact ? "mt-4" : "mt-5")}>
      <label className="relative block">
        <span className="sr-only">Choose a state or union territory</span>
        <PinIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <select
          value={code}
          onChange={(e) => onStateChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-line bg-card py-2.5 pl-9 pr-8 text-sm font-medium text-ink outline-none transition hover:border-slate-300"
        >
          <optgroup label="States">
            {STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Union territories">
            {UNION_TERRITORIES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </optgroup>
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
          ▾
        </span>
      </label>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={`Search in ${stateName}…`}
          className="w-full appearance-none rounded-xl border border-line bg-paper py-2 pl-9 pr-3 text-xs text-ink outline-none placeholder:text-muted"
        />
        {searching ? (
          <p className="mt-1 text-[10px] text-muted">Searching…</p>
        ) : null}
        {!searching && query.trim().length >= MIN_SEARCH_CHARS && results.length === 0 ? (
          <p className="mt-1 text-[10px] text-muted">
            No place found in {stateName}. Try another spelling or state.
          </p>
        ) : null}
        {!searching && !results.length && crossState.length ? (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-line bg-card shadow-lg">
            {crossState.map((place) => (
              <button
                key={`${place.stateCode}-${place.name}`}
                type="button"
                onClick={() => choose(place, place.stateCode)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-ink transition hover:bg-paper"
              >
                <span className="truncate">{place.name}</span>
                <span className="shrink-0 text-[9px] text-muted">
                  {place.stateName}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {results.length ? (
          <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-line bg-card shadow-lg">
            {results.slice(0, 6).map((result) => (
              <button
                key={result.id}
                type="button"
                aria-label={`${result.name}${result.monitor ? ", ground monitor available" : ", model estimate only"}`}
                onClick={() => choose(result)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs text-ink transition hover:bg-paper"
              >
                <span className="min-w-0">
                  <span className="block truncate">{result.name}</span>
                  {result.near || result.admin2 ? (
                    <span className="block truncate text-[9px] text-muted">
                      near {result.near ?? result.admin2}
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
                  {result.monitor ? "monitor" : "model"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
