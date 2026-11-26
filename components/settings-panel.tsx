"use client";

import type { Profile } from "@/lib/profile";
import { LANGUAGES } from "@/lib/profile-options";
import { cn } from "@/lib/ui";
import {
  setMotionPreference,
  useDarkReaderDetected,
  useMotionPreference,
  useSystemReducedMotion,
} from "@/lib/motion";
import { ProfileEditor } from "./profile-editor";
import { WindIcon } from "./icons";
import {
  setThemePreference,
  useThemePreference,
} from "@/lib/theme";

export function SettingsPanel({
  profile,
  onSaveProfile,
  language,
  setLanguage,
  largeText,
  setLargeText,
  onEdit,
}: {
  profile: Profile;
  onSaveProfile: (next: Profile) => void;
  language: string;
  setLanguage: (v: string) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  onEdit: () => void;
}) {
  const motion = useMotionPreference();
  const systemReduced = useSystemReducedMotion();
  const darkReader = useDarkReaderDetected();
  const theme = useThemePreference();

  return (
    <div className="space-y-4">
      <ProfileEditor profile={profile} onSave={onSaveProfile} />
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-xl bg-paper px-3 py-2 text-[11px] font-medium text-muted ring-1 ring-line transition hover:text-ink"
      >
        Prefer the step-by-step setup? Open guided setup
      </button>
      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Preferred language</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          UI is English for now. Your choice will apply to generated advice when
          Gemini is enabled.
        </p>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Text size</h3>
        <button
          type="button"
          onClick={() => setLargeText(!largeText)}
          className={cn(
            "mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm ring-1 transition",
            largeText ? "bg-ink text-white ring-ink" : "bg-paper text-ink ring-line",
          )}
        >
          <span>Larger text</span>
          <span
            className={cn(
              "relative h-5 w-9 rounded-full transition",
              largeText ? "bg-teal-400" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
                largeText ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
        </button>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Appearance</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          System follows your device. Dark applies to the whole app.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["light", "dark", "system"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setThemePreference(option)}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-medium ring-1 transition",
                theme === option
                  ? "bg-brand text-white ring-brand"
                  : "bg-paper text-ink ring-line hover:bg-white",
              )}
            >
              {option === "light"
                ? "Light"
                : option === "dark"
                  ? "Dark"
                  : "System"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Animations</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Weather scene, AQI number, and card motion. Auto follows your
          device&apos;s Reduce Motion setting.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(["auto", "on", "off"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMotionPreference(option)}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-medium ring-1 transition",
                motion === option
                  ? "bg-ink text-white ring-ink"
                  : "bg-paper text-ink ring-line hover:bg-white",
              )}
            >
              {option === "auto" ? "Auto" : option === "on" ? "On" : "Off"}
            </button>
          ))}
        </div>
        {darkReader ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-200">
            Dark Reader is on. It replaces the weather colours and can hide the
            background animation. Pause Dark Reader for this site to see it.
          </p>
        ) : null}
        {motion === "auto" && systemReduced ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-5 text-amber-800 ring-1 ring-amber-200">
            Your laptop reports Reduce Motion, so animations are paused. Choose
            On to see them anyway.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Data</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Live AQI from CPCB and OpenAQ ground monitors, with CAMS model data
          when no monitor is nearby. Every reading shows its source and age.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
          <WindIcon className="h-3.5 w-3.5" />
          No accounts. No community. No data shared.
        </div>
      </section>
    </div>
  );
}
