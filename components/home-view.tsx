"use client";

import type { Reading } from "@/lib/aqi";
import type { Brief } from "@/lib/ai/types";
import { BAND_STYLES, cn } from "@/lib/ui";
import type { Tab } from "@/lib/nav";
import {
  AlertIcon,
  ChatIcon,
  HomeIcon,
  MaskIcon,
  PinIcon,
  ShareIcon,
  SparkIcon,
  WindIcon,
} from "./icons";
import { WeatherScene } from "./weather-scene";
import { shortStationName } from "@/lib/format";
import { AqiNumber } from "./aqi-number";
import { useT } from "./language-provider";
import { stationLabel } from "@/lib/i18n";

type Props = {
  reading: Reading;
  onNavigate: (tab: Tab) => void;
  brief?: Brief | null;
  briefLoading?: boolean;
};

function SectionCard({
  icon,
  title,
  subtitle,
  children,
  delay = 0,
  variant = "plain",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
  variant?: "plain" | "panel";
}) {
  return (
    <section
      className={cn(
        "animate-rise",
        variant === "panel"
          ? "rounded-2xl border border-line/80 bg-card p-5"
          : "border-t border-line pt-5",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-brand">{icon}</span>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="text-[11px] leading-4 text-muted sm:max-w-[48%] sm:text-right">
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function HomeView({
  reading,
  onNavigate,
  brief,
  briefLoading,
}: Props) {
  const { t, language } = useT();
  const styles = BAND_STYLES[reading.band.key];
  const pollutantOrder = ["PM2.5", "PM10", "NO₂", "SO₂", "O₃", "NH₃"];
  const displayPollutants = [...reading.pollutants]
    .filter((p) => p.label !== "CO")
    .sort(
      (a, b) =>
        pollutantOrder.indexOf(a.label) - pollutantOrder.indexOf(b.label),
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section
        className={cn(
          "weather-hero animate-rise relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
          !reading.weather.isDay && "hero-night",
        )}
      >
        <WeatherScene
          condition={reading.weather.condition}
          isDay={reading.weather.isDay}
          aqi={reading.aqi}
        />
        <span className="animate-sheen pointer-events-none absolute inset-y-0 -left-1/3 z-[1] w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="relative z-10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <PinIcon className="h-3.5 w-3.5" />
              <span className="truncate">
                {reading.area}, {reading.state.name}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="relative flex items-end">
                <div
                  className={cn(
                    "animate-glow pointer-events-none absolute -left-5 -top-4 h-28 w-28 rounded-full blur-3xl",
                    styles.dot,
                  )}
                />
                <AqiNumber
                  value={reading.aqi}
                  className="relative text-[64px] font-semibold leading-none tracking-[-0.04em] text-ink"
                />
              </div>
              <span
                className={cn(
                  "mb-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  styles.soft,
                  styles.text,
                  styles.ring,
                )}
              >
                {reading.band.label}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">{reading.dominant}</span>{" "}
              {t("ui.hero.dominant")}
              {reading.basis ? (
                <span className="ml-1 text-[10px] text-muted">
                  {t("ui.hero.aqiFrom", { basis: reading.basis })}
                </span>
              ) : null}
            </p>
          </div>


        </div>

        {reading.source.type === "model" ? (
          <p className="mt-2 text-[11px] leading-5 text-muted">
            {t("ui.hero.modelNote")}{" "}
            {reading.nearby?.length
              ? t("ui.hero.nearestMonitor", {
                  km: reading.nearby[0].distanceKm,
                  aqi: reading.nearby[0].aqi,
                })
              : t("ui.hero.noMonitor60")}
          </p>
        ) : null}

        {reading.source.type === "approximate" ? (
          <p className="mt-2 text-[11px] leading-5 text-muted">
            {reading.stations && reading.stations.length > 1
              ? t("ui.hero.approxMany", {
                  n: reading.stations.length,
                  min: Math.min(...reading.stations.map((s) => s.distanceKm)),
                  max: Math.max(...reading.stations.map((s) => s.distanceKm)),
                })
              : t("ui.hero.approxOne", {
                  km: reading.source.distanceKm,
                })}
          </p>
        ) : null}
        {reading.source.type === "approximate" && reading.stations?.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
            <span className="font-medium text-ink">
              {t("ui.hero.reference")}
            </span>
            {reading.stations.map((station) => (
              <span
                key={station.name}
                className="rounded-full bg-white/55 px-2 py-0.5 ring-1 ring-white/60"
              >
                {shortStationName(station.name)} · {station.distanceKm} km · AQI{" "}
                {station.aqi}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              reading.source.type === "ground"
                ? "bg-emerald-500"
                : reading.source.type === "approximate"
                  ? "bg-orange-500"
                  : "bg-amber-500",
            )}
          />
          <span className="font-medium text-ink">
            {stationLabel(language, reading.source.station)}
          </span>
          {reading.source.distanceKm > 0 ? <span>· {reading.source.distanceKm} km</span> : null}
          <span>· {reading.source.updated}</span>
          {reading.source.type === "model" && reading.nearestStationKm ? (
            <span>
              · {t("ui.hero.nearestCpcb", {
                km: Math.round(reading.nearestStationKm),
              })}
            </span>
          ) : null}
          <span className="rounded-full bg-white/55 px-2 py-0.5 ring-1 ring-white/60 backdrop-blur-sm">
            {reading.source.type === "ground"
              ? t("ui.hero.ground")
              : reading.source.type === "approximate"
                ? reading.stations && reading.stations.length > 1
                  ? t("ui.hero.nearestMany")
                  : t("ui.hero.nearestOne")
                : t("ui.hero.model")}
          </span>
          {reading.usAqi ? (
            <span
              title={`US EPA scale for comparison, driven by ${reading.usAqiBasis ?? "PM"}. The two scales cross over, so this can be higher or lower than NAQI.`}
              className="rounded-full bg-white/55 px-2 py-0.5 ring-1 ring-white/60 backdrop-blur-sm"
            >
              US AQI {reading.usAqi}
              {reading.usAqiBasis ? ` · ${reading.usAqiBasis}` : ""}
            </span>
          ) : null}
          {reading.aqiRange ? (
            <span
              title="Lowest and highest AQI among official stations in this city"
              className="rounded-full bg-white/55 px-2 py-0.5 ring-1 ring-white/60 backdrop-blur-sm"
            >
              {reading.source.type === "approximate"
                ? t("ui.hero.monitors")
                : t("ui.hero.stations")}{" "}
              {reading.aqiRange.min}–{reading.aqiRange.max}
            </span>
          ) : null}
          {reading.demo ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">
              {t("ui.hero.demo")}
            </span>
          ) : reading.degraded ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">
              {t("ui.status.degraded")}
            </span>
          ) : reading.stale ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">
              {t("ui.hero.cached")}
            </span>
          ) : reading.source.type === "approximate" ? (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700 ring-1 ring-orange-200">
              {t("ui.hero.approx")}
            </span>
          ) : reading.source.type === "model" ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">
              {t("ui.hero.modelOnly")}
            </span>
          ) : (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 font-medium text-teal-700 ring-1 ring-teal-100">
              {t("ui.hero.live")}
            </span>
          )}
        </div>

        <div className="pollutant-grid mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {displayPollutants.map((p) => (
            <div
              key={p.label}
              className={cn(
                "rounded-xl px-2.5 py-2 ring-1 backdrop-blur-sm",
                p.label === "PM2.5"
                  ? cn(styles.soft, styles.ring)
                  : "bg-white/55 ring-white/60",
              )}
            >
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{p.label}</div>
              <div className="tabular mt-1 text-sm font-semibold text-ink">
                {p.value}
                <span className="ml-1 text-[9px] font-normal text-muted">{p.unit}</span>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {reading.source.type === "model" && reading.nearby?.length ? (
        <SectionCard
          icon={<PinIcon className="h-4 w-4" />}
          title={t("ui.section.nearest")}
          subtitle={t("ui.sub.nearest", { city: reading.area })}
          delay={30}
        >
          <div className="space-y-2">
            {reading.nearby.map((station) => (
              <div
                key={station.name}
                className="flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2 ring-1 ring-line"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-ink">
                    {station.name}
                  </div>
                  <div className="text-[10px] text-muted">
                    {station.distanceKm} km away · updated{" "}
                    {station.ageMinutes < 60
                      ? `${station.ageMinutes} min ago`
                      : `${Math.round(station.ageMinutes / 60)}h ago`}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="tabular text-sm font-semibold text-ink">
                    {station.aqi}
                  </div>
                  <div className="text-[10px] text-muted">{station.bandLabel}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted">
            {t("ui.notice.nearest", { city: reading.area })}
          </p>
        </SectionCard>
      ) : null}
      {brief ? (
        <SectionCard
          variant="panel"
          icon={<SparkIcon className="h-4 w-4" />}
          title={t("ui.section.brief")}
          subtitle={
            brief.source === "ai"
              ? t("ui.sub.briefAI", { model: brief.model ?? "Gemini" })
              : t("ui.sub.briefRules")
          }
          delay={40}
        >
          <p className="text-sm font-medium leading-6 text-ink">
            {brief.directive}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{brief.why}</p>
          <div className="mt-3 rounded-xl bg-paper p-3 text-xs leading-5 text-ink/80 ring-1 ring-line">
            <span className="font-semibold text-ink">
              {t("ui.brief.mustGoLabel")}
            </span>{" "}
            {brief.mustGoOut}
          </div>
          {brief.doNow.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {brief.doNow.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-paper px-2.5 py-1 text-[10px] text-muted ring-1 ring-line"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-[11px] text-muted">
            {t("ui.brief.disclaimer")}
          </p>
        </SectionCard>
      ) : (
        <SectionCard
          icon={<WindIcon className="h-4 w-4" />}
          title={t("ui.section.guideline")}
          subtitle={
            briefLoading
              ? t("ui.sub.guidelineLoading")
              : t("ui.sub.guideline")
          }
          delay={40}
        >
          <ul className="space-y-2.5">
            {reading.guidelines.map((g) => (
              <li key={g} className="flex gap-2.5 text-sm leading-6 text-ink/90">
                <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                <span>{g}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted">
            {t("ui.guideline.disclaimer")}
          </p>
        </SectionCard>
      )}

      {/* Family */}
      <SectionCard
        icon={<HomeIcon className="h-4 w-4" />}
        title={t("ui.section.family")}
        subtitle={
          reading.family.length === 1
            ? t("ui.sub.familyCountOne")
            : reading.family.length
              ? t("ui.sub.familyCount", { count: reading.family.length })
              : t("ui.sub.familyEmpty")
        }
        delay={80}
      >
        <div className="space-y-2">
          {reading.family.length === 0 ? (
            <div className="rounded-xl bg-paper p-3 ring-1 ring-line">
              <p className="text-sm leading-6 text-muted">
                {t("ui.family.empty")}
              </p>
              <button
                type="button"
                onClick={() => onNavigate("settings")}
                className="mt-2 rounded-full bg-brand px-3 py-1.5 text-[11px] font-medium text-white"
              >
                {t("ui.family.add")}
              </button>
            </div>
          ) : null}
          {reading.family.map((person) => (
            <div
              key={person.name}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 ring-1",
                person.tone === "warn"
                  ? "bg-red-50/70 ring-red-100"
                  : "bg-paper ring-line",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  person.tone === "warn"
                    ? "bg-red-100 text-red-700"
                    : "bg-teal-50 text-teal-700",
                )}
              >
                {person.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-ink">{person.name}</span>
                  <span className="text-[11px] text-muted">{person.meta}</span>
                </div>
                <p className="mt-1 text-sm leading-5 text-ink/85">{person.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* If you must go out */}
      <SectionCard
        icon={<MaskIcon className="h-4 w-4" />}
        title={t("ui.section.mustGo")}
        subtitle={t("ui.sub.mustGo")}
        delay={120}
      >
        <div className="space-y-2">
          {reading.mustGoOut.map((row) => (
            <div key={row.name} className="rounded-xl bg-paper p-3 ring-1 ring-line">
              <div className="text-xs font-semibold text-ink">{row.name}</div>
              <p className="mt-1 text-sm leading-5 text-ink/85">{row.advice}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <AlertIcon className="h-3.5 w-3.5" />
          {t("ui.hero.windows", {
            best: reading.windows.best,
            avoid: reading.windows.avoid,
          })}
        </p>
      </SectionCard>

      {/* Do now */}
      <SectionCard
        icon={<HomeIcon className="h-4 w-4" />}
        title={t("ui.section.doNow")}
        subtitle={t("ui.sub.doNow")}
        delay={160}
      >
        <div className="space-y-2">
          {reading.doNow.map((item) => (
            <div key={item.title} className="rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-ink">{item.title}</div>
                <span className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-100">
                  {item.impact}
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Help the air */}
      <SectionCard
        icon={<SparkIcon className="h-4 w-4" />}
        title={t("ui.help.title")}
        subtitle={t("ui.help.subtitle")}
        delay={180}
      >
        <div className="space-y-2">
          {reading.helpTheAir.map((item) => (
            <div key={item.title} className="rounded-xl bg-paper p-3 ring-1 ring-line">
              <div className="text-sm font-semibold text-ink">{item.title}</div>
              <p className="mt-1 text-sm leading-5 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Impact */}
      <section
        className="animate-rise overflow-hidden rounded-2xl bg-[#083d39] p-5 text-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-teal-200">
            <SparkIcon className="h-4 w-4" />
            {t("ui.section.impact")}
          </div>
          <span className="text-[10px] text-teal-100/60">
            {reading.area} · AQI {reading.aqi}
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-teal-200/80">
              {t("ui.impact.when")}
            </span>
            <span className="text-right text-sm font-semibold">
              {reading.windows.best}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-teal-200/80">
              {t("ui.impact.do")}
            </span>
            <span className="text-right text-sm font-medium text-teal-50">
              {reading.impact.title}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-teal-200/80">
              {t("ui.impact.payoff")}
            </span>
            <span className="text-right text-sm font-semibold">
              {reading.impact.value}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-5 text-teal-100/70">
          {reading.impact.title}. {reading.impact.note}
        </p>

        <button
          type="button"
          onClick={() => onNavigate("cards")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15 active:scale-[0.99]"
        >
          <ShareIcon className="h-3.5 w-3.5" />
          {t("ui.impact.button")}
        </button>
      </section>

      {/* Primary action - one CTA, nav handles the rest */}
      <div>
        <button
          type="button"
          onClick={() => onNavigate("ask")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e] active:scale-[0.99] sm:w-auto"
        >
          <ChatIcon className="h-4 w-4" />
          {t("ui.action.ask")}
        </button>
      </div>
    </div>
  );
}

export function TodaySkeleton({ city }: { city: string }) {
  const { t } = useT();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  const night = hour < 6 || hour >= 18;

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div
        className={cn(
          "animate-soft relative overflow-hidden rounded-3xl p-5 ring-1 ring-black/5",
          night ? "weather-hero hero-night" : "bg-line/30",
        )}
      >
        {night ? (
          <WeatherScene condition="clear" isDay={false} aqi={0} />
        ) : null}
        <div className="relative z-10">
          <div
            className={cn(
              "h-3 w-28 rounded-full",
              night ? "bg-white/20" : "bg-card/70",
            )}
          />
          <div className="mt-4 flex items-end gap-3">
            <div
              className={cn(
                "h-14 w-28 rounded-2xl",
                night ? "bg-white/15" : "bg-card/80",
              )}
            />
            <div
              className={cn(
                "mb-2 h-6 w-20 rounded-full",
                night ? "bg-white/10" : "bg-card/60",
              )}
            />
          </div>
          <div
            className={cn(
              "mt-4 h-3 w-64 max-w-full rounded-full",
              night ? "bg-white/15" : "bg-card/60",
            )}
          />
          <div
            className={cn(
              "mt-2 h-3 w-44 rounded-full",
              night ? "bg-white/10" : "bg-card/50",
            )}
          />
          <div className="mt-6 flex gap-2">
            <div
              className={cn(
                "h-8 w-24 rounded-full",
                night ? "bg-white/15" : "bg-card/60",
              )}
            />
            <div
              className={cn(
                "h-8 w-24 rounded-full",
                night ? "bg-white/10" : "bg-card/50",
              )}
            />
          </div>
          <p
            className={cn(
              "mt-5 text-[11px] font-medium",
              night ? "text-white/80" : "text-muted",
            )}
          >
            {t("ui.header.loading")} {city}
          </p>
        </div>
      </div>
      <div className="animate-soft h-36 rounded-2xl bg-card ring-1 ring-black/5" />
      <div className="animate-soft h-28 rounded-2xl bg-card ring-1 ring-black/5" />
    </div>
  );
}
