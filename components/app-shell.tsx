"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import { mockReading, readingFromAir } from "@/lib/aqi";
import { useAirReading } from "@/lib/air/use-reading";
import { useBrief } from "@/lib/ai/use-brief";
import { citiesFor, findState } from "@/lib/states";
import {
  getProfileSnapshot,
  getServerProfileSnapshot,
  parseProfile,
  saveProfile,
  subscribeProfile,
  type Profile,
} from "@/lib/profile";
import { Onboarding } from "./onboarding";
import type { Tab } from "@/lib/nav";
import { cn } from "@/lib/ui";
import { HomeView } from "./home-view";
import { LocationSelect } from "./location-picker";
import {
  AskPanel,
  CardsPanel,
  ReportPanel,
  SettingsPanel,
  ShareCardPreview,
} from "./panels";
import {
  ArrowIcon,
  CardsIcon,
  ChatIcon,
  HomeIcon,
  ReportIcon,
  SettingsIcon,
  ShareIcon,
  WindIcon,
} from "./icons";

const NAV: { tab: Tab; label: string; icon: React.ReactNode }[] = [
  { tab: "today", label: "Today", icon: <WindIcon className="h-4 w-4" /> },
  { tab: "ask", label: "Ask", icon: <ChatIcon className="h-4 w-4" /> },
  { tab: "report", label: "Report", icon: <ReportIcon className="h-4 w-4" /> },
  { tab: "cards", label: "Cards", icon: <CardsIcon className="h-4 w-4" /> },
  { tab: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <WindIcon className="h-5 w-5" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-ink">AirMitra</div>
        <div className="text-[10px] text-muted">Household Air Coach</div>
      </div>
    </div>
  );
}

export function AppShell() {
  const rawProfile = useSyncExternalStore(
    subscribeProfile,
    getProfileSnapshot,
    getServerProfileSnapshot,
  );
  const profile = useMemo(() => parseProfile(rawProfile), [rawProfile]);
  const [editing, setEditing] = useState(false);
  const [editVersion, setEditVersion] = useState(0);

  if (!profile || editing) {
    return (
      <Onboarding
        initial={profile}
        onComplete={(next) => {
          saveProfile(next);
          setEditing(false);
          setEditVersion((v) => v + 1);
        }}
      />
    );
  }

  return (
    <AppShellInner
      key={editVersion}
      profile={profile}
      onEdit={() => setEditing(true)}
    />
  );
}

function AppShellInner({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
  const [target, setTarget] = useState(profile.location);
  const [tab, setTab] = useState<Tab>("today");
  const [language, setLanguage] = useState(profile.language);
  const [largeText, setLargeText] = useState(profile.largeText);

  const code = target.stateCode;
  const city = { name: target.city, lat: target.lat, lon: target.lon };
  const state = useMemo(() => findState(code), [code]);

  const { data, error } = useAirReading(code, city.lat, city.lon, city.name);
  const reading = useMemo(
    () =>
      data
        ? readingFromAir(state, data, undefined, false, profile)
        : mockReading(state, profile),
    [data, state, profile],
  );

  const { brief, loading: briefLoading } = useBrief({
    profile,
    state: code,
    city: city.name,
    lat: city.lat,
    lon: city.lon,
  });

  function persistTarget(next: {
    stateCode: string;
    city: string;
    lat: number;
    lon: number;
  }) {
    setTarget(next);
    saveProfile({ ...profile, location: next });
  }

  function changeState(next: string) {
    const first = citiesFor(next)[0];
    persistTarget({
      stateCode: next,
      city: first.name,
      lat: first.lat,
      lon: first.lon,
    });
  }

  function changeTarget(next: {
    stateCode: string;
    city: string;
    lat: number;
    lon: number;
  }) {
    persistTarget(next);
  }

  function changeLanguage(next: string) {
    setLanguage(next);
    saveProfile({ ...profile, language: next });
  }

  function changeLargeText(next: boolean) {
    setLargeText(next);
    saveProfile({ ...profile, largeText: next });
  }

  function saveFullProfile(next: Profile) {
    saveProfile(next);
    setTarget(next.location);
    setLanguage(next.language);
    setLargeText(next.largeText);
  }

  const badge = reading.demo
    ? error
      ? {
          label: "offline demo",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
      : {
          label: "demo data",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
    : reading.degraded
      ? {
          label: "ground feed down",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
      : reading.stale
        ? {
            label: "cached",
            className: "bg-amber-50 text-amber-700 ring-amber-200",
          }
        : reading.source.type === "model"
          ? {
              label: "model estimate",
              className: "bg-amber-50 text-amber-700 ring-amber-200",
            }
          : {
              label: "live",
              className: "bg-teal-50 text-teal-700 ring-teal-100",
            };

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    return () => document.documentElement.classList.remove("large-text");
  }, [largeText]);

  const content =
    tab === "today" ? (
      <HomeView
        reading={reading}
        onNavigate={setTab}
        brief={brief}
        briefLoading={briefLoading}
      />
    ) : tab === "ask" ? (
      <AskPanel
        reading={reading}
        profile={profile}
        stateCode={code}
        city={city.name}
        lat={city.lat}
        lon={city.lon}
      />
    ) : tab === "report" ? (
      <ReportPanel />
    ) : tab === "cards" ? (
      <CardsPanel reading={reading} />
    ) : (
      <SettingsPanel
        profile={profile}
        onSaveProfile={saveFullProfile}
        language={language}
        setLanguage={changeLanguage}
        largeText={largeText}
        setLargeText={changeLargeText}
        onEdit={onEdit}
      />
    );

  return (
    <div className="min-h-dvh bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-paper/85 px-5 py-6 backdrop-blur lg:flex">
        <Brand />
        <LocationSelect
          code={code}
          onStateChange={changeState}
          onSelectLocation={changeTarget}
        />

        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => setTab(item.tab)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                tab === item.tab
                  ? "bg-ink text-white shadow-sm"
                  : "text-ink/70 hover:bg-white hover:text-ink",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between text-[10px] text-muted">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium ring-1",
              badge.className,
            )}
          >
            {badge.label}
          </span>
          <span>English</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-[264px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/90 px-4 pb-3 pt-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <button
              type="button"
              onClick={() => setTab("settings")}
              className="rounded-full bg-card px-3 py-1.5 text-[11px] font-medium text-ink ring-1 ring-line"
            >
              English
            </button>
          </div>
          <LocationSelect
            code={code}
            onStateChange={changeState}
            onSelectLocation={changeTarget}
            compact
          />
        </header>

        <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
          <main className="min-w-0 flex-1">
            <div className="mb-4 hidden items-end justify-between lg:flex">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">
                  {tab === "today" ? "Today" : NAV.find((n) => n.tab === tab)?.label}
                </h1>
                <p className="text-xs text-muted">
                  {reading.demo ? "Demo conditions for your area" : "Live conditions for your area"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
                <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
                  English
                </span>
              </div>
            </div>

            {content}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
              <span>
                India AQI uses CPCB NAQI · general guidance, not medical advice
              </span>
              <Link
                href={`/aqi/${slugify(state.name)}/${slugify(city.name)}`}
                className="font-medium text-brand hover:underline"
              >
                Public page for {city.name} →
              </Link>
            </footer>
          </main>

          {/* Right rail */}
          <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
            <div>
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-medium text-muted">
                <ShareIcon className="h-3.5 w-3.5" />
                Share preview
              </div>
              <ShareCardPreview reading={reading} />
              <button
                type="button"
                onClick={() => setTab("cards")}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-2.5 text-xs font-medium text-ink ring-1 ring-line transition hover:bg-white"
              >
                Open share card
                <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <HomeIcon className="h-4 w-4 text-brand" />
                Why this advice
              </div>
              <ul className="mt-2 space-y-2 text-[11px] leading-5 text-muted">
                <li>Family: father (asthma), daughter (6).</li>
                <li>Home: no purifier, gas stove, agarbatti.</li>
                <li>Source: CPCB / OpenAQ / CAMS, with freshness shown.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => setTab(item.tab)}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition",
                tab === item.tab ? "text-brand" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition",
                  tab === item.tab ? "bg-teal-50 text-brand" : "text-muted",
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
