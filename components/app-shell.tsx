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
import { LanguageProvider, useT } from "./language-provider";
import { optionLabel, stationLabel } from "@/lib/i18n";
import type { Tab } from "@/lib/nav";
import { cn } from "@/lib/ui";
import { BrandMark } from "./brand-mark";
import { HomeView, TodaySkeleton } from "./home-view";
import { LocationSelect } from "./location-picker";
import { AskPanel, CardsPanel } from "./panels";
import { SettingsPanel } from "./settings-panel";
import { ShareCardPreview } from "./share-cards";
import {
  ArrowIcon,
  CardsIcon,
  ChatIcon,
  HomeIcon,
  SettingsIcon,
  ShareIcon,
  WindIcon,
} from "./icons";

const NAV: { tab: Tab; key: string; icon: React.ReactNode }[] = [
  { tab: "today", key: "ui.nav.today", icon: <WindIcon className="h-4 w-4" /> },
  { tab: "ask", key: "ui.nav.ask", icon: <ChatIcon className="h-4 w-4" /> },
  { tab: "cards", key: "ui.nav.cards", icon: <CardsIcon className="h-4 w-4" /> },
  { tab: "settings", key: "ui.nav.settings", icon: <SettingsIcon className="h-4 w-4" /> },
];

function Brand() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark className="h-9 w-9 shadow-sm" />
      <div className="leading-tight">
        <div className="font-display text-base font-semibold tracking-tight text-ink">AirMitra</div>
        <div className="text-[10px] text-muted">{t("ui.brand.tagline")}</div>
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
  const [draftLanguage, setDraftLanguage] = useState("English");
  const uiLanguage = editing
    ? draftLanguage
    : profile?.language ?? draftLanguage;

  return (
    <LanguageProvider language={uiLanguage}>
      {!profile || editing ? (
        <Onboarding
          initial={profile}
          onLanguageChange={setDraftLanguage}
          onComplete={(next) => {
            saveProfile(next);
            setDraftLanguage(next.language);
            setEditing(false);
            setEditVersion((v) => v + 1);
          }}
        />
      ) : (
        <AppShellInner
          key={editVersion}
          profile={profile}
          onLanguageChange={setDraftLanguage}
          onEdit={() => {
            setDraftLanguage(profile.language);
            setEditing(true);
          }}
        />
      )}
    </LanguageProvider>
  );
}

function AppShellInner({
  profile,
  onEdit,
  onLanguageChange,
}: {
  profile: Profile;
  onEdit: () => void;
  onLanguageChange: (language: string) => void;
}) {
  const { t, language, native, locale } = useT();
  const [target, setTarget] = useState(profile.location);
  const [tab, setTab] = useState<Tab>("today");
  const [largeText, setLargeText] = useState(profile.largeText);

  const code = target.stateCode;
  const city = { name: target.city, lat: target.lat, lon: target.lon };
  const state = useMemo(() => findState(code), [code]);

  const { data, error, loading } = useAirReading(
    code,
    city.lat,
    city.lon,
    city.name,
  );
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
    onLanguageChange(next);
    saveProfile({ ...profile, language: next });
  }

  function changeLargeText(next: boolean) {
    setLargeText(next);
    saveProfile({ ...profile, largeText: next });
  }

  const familyLine = profile.family.length
    ? profile.family
        .map(
          (member) =>
            `${optionLabel(language, "relation", member.relation)} (${member.ageBand})`,
        )
        .join(", ")
    : t("ui.sub.familyEmpty");

  const homeLine = [
    profile.home.type,
    profile.home.purifiers === "None" || profile.home.purifiers === "Not sure"
      ? "no purifier"
      : `purifier: ${profile.home.purifiers}`,
    profile.home.cooking.length
      ? `cooking: ${profile.home.cooking.join(", ")}`
      : null,
    profile.home.indoorSmoke.length
      ? `smoke: ${profile.home.indoorSmoke.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function saveFullProfile(next: Profile) {
    saveProfile(next);
    setTarget(next.location);
    onLanguageChange(next.language);
    setLargeText(next.largeText);
  }

  const badge = loading && !error
    ? {
        key: "ui.status.loading",
        className: "bg-slate-100 text-slate-600 ring-slate-200",
      }
    : reading.demo
    ? error
      ? {
          key: "ui.status.offline",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
      : {
          key: "ui.status.demo",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
    : reading.degraded
      ? {
          key: "ui.status.degraded",
          className: "bg-amber-50 text-amber-700 ring-amber-200",
        }
      : reading.stale
        ? {
            key: "ui.status.cached",
            className: "bg-amber-50 text-amber-700 ring-amber-200",
          }
        : reading.source.type === "model"
          ? {
              key: "ui.status.model",
              className: "bg-amber-50 text-amber-700 ring-amber-200",
            }
          : {
              key: "ui.status.live",
              className: "bg-teal-50 text-teal-700 ring-teal-100",
            };

  useEffect(() => {
    document.documentElement.classList.toggle("large-text", largeText);
    return () => document.documentElement.classList.remove("large-text");
  }, [largeText]);

  const content =
    loading && !error && tab !== "settings" ? (
      <TodaySkeleton city={city.name} />
    ) : tab === "today" ? (
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-[color:var(--sidebar)] px-5 py-6 backdrop-blur lg:flex">
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
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink/70 hover:bg-white hover:text-ink",
              )}
            >
              {item.icon}
              {t(item.key)}
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
            {t(badge.key)}
          </span>
          <span>{native}</span>
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-[264px]">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 px-4 pb-3 pt-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Brand />
            <button
              type="button"
              onClick={() => setTab("settings")}
              className="rounded-full bg-card px-3 py-1.5 text-[11px] font-medium text-ink ring-1 ring-line"
            >
              {native}
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
            <h1 className="sr-only lg:hidden">
              {t("ui.app.title")}
            </h1>
            <div className="mb-4 hidden items-end justify-between lg:flex">
              <div>
                <h1 className="font-display text-2xl font-semibold leading-normal tracking-tight text-ink">
                  {tab === "today"
                    ? t("ui.nav.today")
                    : t(NAV.find((n) => n.tab === tab)?.key ?? "ui.nav.today")}
                </h1>
                <p className="text-xs text-muted">
                  {loading && !error
                    ? t("ui.header.loading")
                    : reading.demo
                      ? t("ui.header.demo")
                      : t("ui.header.live")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                    badge.className,
                  )}
                >
                  {t(badge.key)}
                </span>
                <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
                  {native}
                </span>
              </div>
            </div>

            {content}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
              <span>{t("ui.footer.disclaimer")}</span>
              <Link
                href={`/aqi/${slugify(state.name)}/${slugify(city.name)}?lang=${locale}`}
                className="font-medium text-brand hover:underline"
              >
                {t("ui.footer.public", { city: city.name })}
              </Link>
            </footer>
          </main>

          {/* Right rail */}
          <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
            <div>
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-medium text-muted">
                <ShareIcon className="h-3.5 w-3.5" />
                {t("ui.rail.share")}
              </div>
              <ShareCardPreview reading={reading} />
              <button
                type="button"
                onClick={() => setTab("cards")}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-card px-3 py-2.5 text-xs font-medium text-ink ring-1 ring-line transition hover:bg-white"
              >
                {t("ui.rail.open")}
                <ArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <HomeIcon className="h-4 w-4 text-brand" />
                {t("ui.rail.why")}
              </div>
              <ul className="mt-2 space-y-2 text-[11px] leading-5 text-muted">
                <li>
                  <span className="font-medium text-ink">{t("ui.rail.family")}:</span>{" "}
                  {familyLine}.
                </li>
                <li>
                  <span className="font-medium text-ink">{t("ui.rail.home")}:</span>{" "}
                  {homeLine}.
                </li>
                <li>
                  <span className="font-medium text-ink">{t("ui.rail.source")}:</span>{" "}
                  {stationLabel(language, reading.source.station)} ·{" "}
                  {reading.source.updated}.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
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
                  tab === item.tab ? "bg-brand/10 text-brand" : "text-muted",
                )}
              >
                {item.icon}
              </span>
              {t(item.key)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
