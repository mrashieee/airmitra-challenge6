import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveAirReading } from "@/lib/air/resolve";
import { readingFromAir } from "@/lib/aqi";
import { cityBySlug, citiesForStatePage, slugify, stateBySlug } from "@/lib/city-page";
import { createDefaultProfile } from "@/lib/profile";
import { BAND_STYLES, cn } from "@/lib/ui";
import { PinIcon, SparkIcon, WindIcon } from "@/components/icons";
import { BrandMark } from "@/components/brand-mark";
import { WeatherScene } from "@/components/weather-scene";
import { AqiNumber } from "@/components/aqi-number";

type Params = { params: Promise<{ state: string; city: string }> };

export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params;
  const state = stateBySlug(stateSlug);
  const city = state ? await cityBySlug(state.code, citySlug) : null;
  const place = city?.name ?? citySlug.replace(/-/g, " ");

  return {
    title: `${place} Air Quality (AQI)`,
    description: `Live air quality for ${place}${
      state ? `, ${state.name}` : ""
    }: AQI, pollutants, station freshness, and household guidance.`,
    alternates: { canonical: `/aqi/${stateSlug}/${citySlug}` },
    openGraph: {
      title: `${place} AQI · AirMitra`,
      description: `Live AQI for ${place}${
        state ? `, ${state.name}` : ""
      } with station freshness and household guidance.`,
      type: "website",
      url: `/aqi/${stateSlug}/${citySlug}`,
    },
    twitter: {
      card: "summary",
      title: `${place} AQI · AirMitra`,
      description: `Live AQI for ${place}${
        state ? `, ${state.name}` : ""
      } with household guidance.`,
    },
  };
}

export default async function CityPage({ params }: Params) {
  const { state: stateSlug, city: citySlug } = await params;
  const state = stateBySlug(stateSlug);
  if (!state) notFound();

  const city = await cityBySlug(state.code, citySlug);
  if (!city) notFound();

  const air = await resolveAirReading(state, {
    target: { lat: city.lat, lon: city.lon, city: city.name },
  }).catch(() => null);

  if (!air) notFound();

  const profile = createDefaultProfile();
  profile.location = {
    stateCode: state.code,
    city: city.name,
    lat: city.lat,
    lon: city.lon,
  };

  const reading = readingFromAir(state, air, undefined, false, profile);
  const styles = BAND_STYLES[reading.band.key];
  const usBasisValue = reading.pollutants.find(
    (p) => p.label === reading.usAqiBasis,
  )?.value;
  const dominantValue = reading.pollutants.find(
    (p) => p.label === reading.dominant,
  )?.value;

  const nearby = citiesForStatePage(state.code).filter(
    (entry) => entry.name !== city.name,
  );

  const shareText = encodeURIComponent(
    `${city.name}, ${state.name}: AQI ${reading.aqi} (${reading.band.label}). ${reading.guidelines[0]} — via AirMitra`,
  );

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight text-ink">
              AirMitra
            </span>
            <span className="block text-[10px] text-muted">
              Household Air Coach
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="rounded-full bg-brand px-3.5 py-2 text-xs font-medium text-white"
        >
          Open app
        </Link>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16">
        <h1 className="sr-only">
          {city.name} Air Quality Index (AQI), {state.name}
        </h1>
        <section
          className={cn(
            "weather-hero relative overflow-hidden rounded-3xl ring-1 ring-black/5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
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
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <PinIcon className="h-3.5 w-3.5" />
              <span className="truncate">
                {city.name}, {state.name}
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
              <span className="font-medium text-ink">{reading.dominant}</span> is
              the dominant pollutant
              {reading.basis ? (
                <span className="ml-1 text-[10px] text-muted">
                  (AQI from {reading.basis})
                </span>
              ) : null}
            </p>

            {reading.source.type === "model" ? (
              <p className="mt-2 text-[11px] leading-5 text-muted">
                Model estimate, not a local monitor.{" "}
                {reading.nearby?.length
                  ? `Nearest monitor: ${reading.nearby[0].distanceKm} km away, AQI ${reading.nearby[0].aqi}.`
                  : "No ground monitor within 60 km."}
              </p>
            ) : null}

                {reading.source.type === "approximate" ? (
              <p className="mt-2 text-[11px] leading-5 text-muted">
                {reading.stations && reading.stations.length > 1
                  ? `Approximate: median of ${reading.stations.length} live monitors, ${Math.min(
                      ...reading.stations.map((s) => s.distanceKm),
                    )}–${Math.max(
                      ...reading.stations.map((s) => s.distanceKm),
                    )} km away. Not local stations.`
                  : `Approximate reading from the nearest monitor ${reading.source.distanceKm} km away. Not a local station.`}
              </p>
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
                {reading.source.station}
              </span>
              {reading.source.distanceKm > 0 ? (
                <span>· {reading.source.distanceKm} km</span>
              ) : null}
              <span>· {reading.source.updated}</span>
              {reading.source.type === "model" && reading.nearestStationKm ? (
                <span>
                  · nearest CPCB {Math.round(reading.nearestStationKm)} km
                </span>
              ) : null}
              <span className="rounded-full bg-white/55 px-2 py-0.5 ring-1 ring-white/60 backdrop-blur-sm">
                {reading.source.type === "ground"
                  ? "ground monitor"
                  : reading.source.type === "approximate"
                    ? reading.stations && reading.stations.length > 1
                      ? "nearest monitors"
                      : "nearest monitor"
                    : "model estimate"}
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
                    ? "monitors"
                    : "stations"}{" "}
                  {reading.aqiRange.min}–{reading.aqiRange.max}
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <WindIcon className="h-4 w-4 text-brand" />
            What this means today
          </div>
          <ul className="mt-3 space-y-2.5">
            {reading.guidelines.map((guideline) => (
              <li
                key={guideline}
                className="flex gap-2.5 text-sm leading-6 text-ink/90"
              >
                <span
                  className={cn(
                    "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                    styles.dot,
                  )}
                />
                <span>{guideline}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted">
            General guidance, not medical advice.
          </p>
        </section>

        {reading.usAqi ? (
          <section className="mt-6 border-t border-line pt-5">
            <div className="font-display text-lg font-semibold text-ink">
              Why the number differs from other apps
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              AirMitra uses India&apos;s CPCB NAQI. Many apps use the US EPA
              AQI. Same air, different breakpoints:
            </p>
            <p className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm leading-6 text-ink ring-1 ring-line">
              US AQI{" "}
              <span className="font-semibold">{reading.usAqi}</span>
              {usBasisValue !== undefined ? (
                <span className="text-muted">
                  {" "}
                  ({reading.usAqiBasis} {usBasisValue} µg/m³)
                </span>
              ) : null}
              {" · "}NAQI{" "}
              <span className="font-semibold">{reading.aqi}</span>
              {dominantValue !== undefined ? (
                <span className="text-muted">
                  {" "}
                  ({reading.dominant} {dominantValue} µg/m³)
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              For cleaner air the US number is usually higher; at very high
              pollution NAQI can be higher. We use NAQI because CPCB, GRAP, and
              Indian health advisories use it.
            </p>
          </section>
        ) : null}

        {reading.source.type === "model" && reading.nearby?.length ? (
          <section className="mt-6 border-t border-line pt-5">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <PinIcon className="h-4 w-4 text-brand" />
              Nearest ground monitors
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">
              {city.name} has no continuous monitor. Closest live stations:
            </p>
            <div className="mt-3 space-y-2">
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
                    <div className="text-[10px] text-muted">
                      {station.bandLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              Different airshed, so use this as regional context — not a local
              reading.
            </p>
          </section>
        ) : null}

        {reading.stations?.length && reading.stations.length >= 2 ? (
          <section className="mt-6 border-t border-line pt-5">
            <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <WindIcon className="h-4 w-4 text-brand" />
              {reading.source.type === "approximate"
                ? "Monitors used for this estimate"
                : `Stations in ${city.name}`}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">
              {reading.source.type === "approximate"
                ? `No monitor in ${city.name}. The headline is the median of the nearest live stations.`
                : "The headline is the median of these official monitors."}
            </p>
            <div className="mt-3 space-y-2">
              {reading.stations.map((station) => (
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
                    <div className="text-[10px] text-muted">
                      {station.bandLabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 rounded-2xl border border-line/80 bg-card p-5">
          <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <SparkIcon className="h-4 w-4 text-brand" />
            For your household
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Who lives with you changes the advice. Asthma, a gas stove, dry
            sweeping, a top-floor flat: each one changes what to do today.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white"
            >
              Set up your household
            </Link>
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-line"
            >
              Share this AQI
            </a>
          </div>
        </section>

        {nearby.length > 0 ? (
          <section className="mt-6 border-t border-line pt-5">
            <div className="font-display text-lg font-semibold text-ink">
              Other cities in {state.name}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {nearby.map((entry) => (
                <Link
                  key={entry.name}
                  href={`/aqi/${stateSlug}/${slugify(entry.name)}`}
                  className="rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-line hover:bg-white"
                >
                  {entry.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-6 text-[11px] leading-5 text-muted">
          Source: {reading.source.station}. India AQI uses CPCB NAQI, not the US
          EPA scale. {reading.source.type === "model"
            ? `${city.name} has no continuous ground monitor, so this is a CAMS model estimate, not a measured reading.`
            : reading.source.type === "approximate"
              ? `This is an approximate reading from the nearest monitor, ${reading.source.distanceKm} km away, not a local station.`
              : "Measured at a ground monitor."}{" "}
          AirMitra is not a medical service.
        </p>
      </main>
    </div>
  );
}
