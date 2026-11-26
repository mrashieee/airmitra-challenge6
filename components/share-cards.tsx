"use client";

import type { Reading } from "@/lib/aqi";
import { BAND_STYLES, cn } from "@/lib/ui";
import { slugify } from "@/lib/slug";

export function ShareCardPreview({ reading }: { reading: Reading }) {
  const styles = BAND_STYLES[reading.band.key];
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm">
      <div className="bg-[#083d39] px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">AirMitra</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-teal-200">
            air advisory
          </div>
        </div>
        <div className="mt-1 text-[11px] text-teal-100/80">
          {reading.area}, {reading.state.name} · {reading.source.updated}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-end gap-2">
          <span className="tabular text-4xl font-semibold tracking-tight text-ink">
            {reading.aqi}
          </span>
          <span className={cn("mb-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1", styles.soft, styles.text, styles.ring)}>
            {reading.band.label}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted">{reading.dominant} dominant</p>

        <div className="mt-3 space-y-2 text-sm leading-6 text-ink/85">
          <p className="font-medium text-ink">{reading.guidelines[0]}</p>
          <p className="text-xs text-muted">{reading.guidelines[1]}</p>
        </div>

        <div className="mt-3 rounded-xl bg-paper p-3 text-xs leading-5 text-ink/80 ring-1 ring-line">
          <span className="font-semibold text-ink">Do now:</span>{" "}
          {reading.doNow
            .slice(0, 2)
            .map((item) => item.title)
            .join(". ")}
          .
        </div>

        <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
          <span>
            {reading.source.type === "ground" ? "Ground monitor" : "Model estimate"} ·{" "}
            {reading.source.station}
          </span>
          <span>via AirMitra</span>
        </div>
      </div>
    </div>
  );
}

export function StoryPreview({ reading }: { reading: Reading }) {
  const styles = BAND_STYLES[reading.band.key];
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[26px] bg-gradient-to-br from-[#052a26] via-[#0a3b36] to-[#0f2b29] text-white shadow-xl ring-1 ring-black/10">
      <div
        className={cn(
          "absolute -right-12 -top-12 h-52 w-52 rounded-full opacity-40 blur-3xl",
          styles.dot,
        )}
      />
      <div className="relative flex h-full flex-col p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">AirMitra</div>
            <div className="text-[7px] uppercase tracking-[0.18em] text-teal-200/70">
              Household air coach
            </div>
          </div>
          <div className="text-[9px] text-teal-100/70">{date}</div>
        </div>

        <div className="mt-5">
          <div className="text-lg font-semibold leading-tight">
            {reading.area}
          </div>
          <div className="text-[9px] text-teal-100/70">{reading.state.name}</div>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <span className="tabular text-[58px] font-semibold leading-none tracking-[-0.04em]">
            {reading.aqi}
          </span>
          <span className="mb-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold text-white ring-1 ring-white/25">
            {reading.band.label}
          </span>
        </div>
        <div className="mt-1 text-[9px] text-teal-100/70">
          {reading.dominant} dominant
          {reading.pollutants.find((p) => p.label === reading.dominant)
            ? ` · ${
                reading.pollutants.find((p) => p.label === reading.dominant)!
                  .value
              } µg/m³`
            : ""}
        </div>

        <div className="mt-4 border-t border-white/15 pt-3">
          <div className="text-[7px] font-semibold uppercase tracking-[0.18em] text-teal-200/70">
            {reading.aqi > 150 ? "Least-bad time out" : "Best time out"}
          </div>
          <div className="mt-0.5 text-base font-semibold leading-tight">
            {reading.windows.best}
          </div>
          <div className="mt-2 text-[7px] font-semibold uppercase tracking-[0.18em] text-teal-200/70">
            Avoid outdoors
          </div>
          <div className="text-[11px] text-white/80">{reading.windows.avoid}</div>
        </div>

        <div className="mt-3">
          <div className="text-[7px] font-semibold uppercase tracking-[0.18em] text-teal-200/70">
            Do now
          </div>
          <ul className="mt-1 space-y-1">
            {reading.doNow.slice(0, 3).map((item) => (
              <li
                key={item.title}
                className="flex gap-1.5 text-[9px] leading-4 text-white/85"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/15">
          <div className="text-[7px] font-semibold uppercase tracking-[0.18em] text-teal-200/70">
            Impact
          </div>
          <div className="mt-0.5 text-sm font-semibold leading-tight">
            {reading.impact.value}
          </div>
          <div className="text-[8px] text-white/75">{reading.impact.title}</div>
          <div className="mt-1 text-[7px] text-white/55">
            If you must go out: fitted N95, short route
          </div>
        </div>

        <div className="mt-auto">
          <div className="text-[7px] text-teal-100/50">
            {reading.source.type === "ground"
              ? "Ground monitor"
              : "CAMS model estimate"}
            {reading.source.distanceKm > 0
              ? ` · ${reading.source.distanceKm} km`
              : ""}{" "}
            · {reading.source.updated}
          </div>
          <div className="mt-1 border-t border-white/15 pt-2">
            <div className="text-[9px] font-medium">
              Check the air before you go out
            </div>
            <div className="text-[7px] text-teal-100/60">
              airmitra-app.vercel.app/aqi/{slugify(reading.state.name)}/
              {slugify(reading.area)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
