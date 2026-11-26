"use client";

import { useMemo, useState } from "react";
import type { Reading } from "@/lib/aqi";
import type { Profile } from "@/lib/profile";
import type { Tab } from "@/lib/nav";
import { BAND_STYLES, cn } from "@/lib/ui";
import { LANGUAGES } from "@/lib/profile-options";
import { ProfileEditor } from "./profile-editor";
import {
  AlertIcon,
  CheckIcon,
  MaskIcon,
  ShareIcon,
  SparkIcon,
  WindIcon,
} from "./icons";



/* ------------------------------------------------------------------ */
/* Ask                                                                 */
/* ------------------------------------------------------------------ */

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  source?: "ai" | "template";
};

function demoAnswer(question: string, reading: Reading): string {
  const q = question.toLowerCase();
  if (q.includes("father") || q.includes("asthma") || q.includes("walk")) {
    return `Not for your father right now. AQI ${reading.aqi} + asthma = high risk before 11 AM. If he must go: fitted N95, under 15 min, and carry the inhaler. Indoors, keep him in the room with the purifier.`;
  }
  if (q.includes("daughter") || q.includes("child") || q.includes("school")) {
    return `For your daughter: keep play indoors today. If she has to go out, a fitted N95 and a short route. AQI ${reading.aqi} is above the safe range for a 6-year-old.`;
  }
  if (q.includes("agarbatti") || q.includes("incense") || q.includes("coil")) {
    return "Skip agarbatti or mosquito coil today. If you must, light it 8–10 PM with a window cracked open. Indoors, these can push PM2.5 up 3–5x for 1–2 hours.";
  }
  if (q.includes("window") || q.includes("open")) {
    return "Keep windows closed while outdoor air is worse than indoor. Ventilate the courtyard side 11 AM–4 PM when wind picks up.";
  }
  return `At AQI ${reading.aqi} (${reading.band.label}), the short answer: ${reading.guidelines[0]} Ask me about a person, a room, or a time and I'll get specific.`;
}

export function AskPanel({
  reading,
  profile,
  stateCode,
  city,
  lat,
  lon,
}: {
  reading: Reading;
  profile: Profile;
  stateCode: string;
  city: string;
  lat: number;
  lon: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: `I know your home and your family. Ask me anything about today — AQI ${reading.aqi}, ${reading.band.label}.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const suggestions = [
    "Can my father walk at 6am?",
    "Is 4 PM safe for my daughter?",
    "What about agarbatti today?",
  ];

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || pending) return;

    setMessages((m) => [...m, { role: "user", text: clean }]);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          state: stateCode,
          city,
          lat,
          lon,
          question: clean,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        answer: string;
        source: "ai" | "template";
      };

      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer, source: data.source },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: demoAnswer(clean, reading),
          source: "template",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <SparkIcon className="h-4 w-4 text-brand" />
          Ask AirMitra
          <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-100">
            AI
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Answers use your live AQI, family, and home. Falls back to rules if
          Gemini is busy.
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6",
              m.role === "user"
                ? "ml-auto bg-ink text-white"
                : "bg-card text-ink ring-1 ring-black/5",
            )}
          >
            {m.text}
            {m.role === "assistant" && m.source ? (
              <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
                {m.source === "ai" ? "Gemini" : "rule-based"}
              </div>
            ) : null}
          </div>
        ))}
        {pending ? (
          <div className="max-w-[92%] rounded-2xl bg-card px-4 py-3 text-sm text-muted ring-1 ring-black/5">
            <span className="animate-soft">Thinking…</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void send(s)}
            className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-line transition hover:bg-paper"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-20 flex gap-2 rounded-2xl bg-card p-2 ring-1 ring-black/5 lg:bottom-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a person, room, or time…"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.99]"
        >
          Send
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const SYMPTOMS = [
  "Cough",
  "Wheeze",
  "Burning eyes",
  "Headache",
  "Breathless",
  "Chest tightness",
  "Throat irritation",
];

const ISSUES = [
  "Garbage burning",
  "Construction dust",
  "Factory smoke",
  "Road dust",
  "Coil / agarbatti",
  "Idling traffic",
];

export function ReportPanel() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("Mild");
  const [issues, setIssues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const redFlag =
    severity === "Severe" &&
    (symptoms.includes("Breathless") || symptoms.includes("Chest tightness"));

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <AlertIcon className="h-4 w-4 text-brand" />
          Tell us what is going on
        </div>
        <p className="mt-1 text-xs text-muted">
          Optional. It changes today&apos;s advice. It is never a diagnosis.
        </p>
      </div>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">How is someone feeling?</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(symptoms, s, setSymptoms)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                symptoms.includes(s)
                  ? "bg-ink text-white ring-ink"
                  : "bg-paper text-ink ring-line hover:bg-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Severity</span>
          {["Mild", "Moderate", "Severe"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                severity === s
                  ? "bg-ink text-white ring-ink"
                  : "bg-paper text-ink ring-line hover:bg-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {redFlag ? (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-800 ring-1 ring-red-200">
            <strong>Red flag.</strong> Breathless at rest or chest tightness is not
            something to wait on. See a doctor now or call emergency services.
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="text-sm font-semibold text-ink">Report a local issue</h3>
        <p className="mt-1 text-xs text-muted">
          Private to your device. We use it to adjust advice and draft a complaint.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ISSUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(issues, s, setIssues)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition",
                issues.includes(s)
                  ? "bg-brand text-white ring-brand"
                  : "bg-paper text-ink ring-line hover:bg-white",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => setSaved(true)}
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.99]"
      >
        Save for today
      </button>

      {saved ? (
        <div className="flex items-start gap-2 rounded-xl bg-teal-50 p-3 text-sm text-teal-900 ring-1 ring-teal-100">
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Saved. Today&apos;s advice now reflects this. No diagnosis, no data shared.
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

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
          <span className="font-semibold text-ink">Do now:</span> {reading.doNow[0].title}.{" "}
          {reading.doNow[1].title}.
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

function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }
}

export function CardsPanel({ reading }: { reading: Reading }) {
  const [copied, setCopied] = useState<"status" | "full" | null>(null);

  const statusText = useMemo(() => {
    const lines = [
      `${reading.area} · AQI ${reading.aqi} (${reading.band.label})`,
      reading.aqi <= 150
        ? `Best time out: ${reading.windows.best}`
        : `Best time out: ${reading.windows.best} — mask still advised`,
      `Avoid outdoors: ${reading.windows.avoid}`,
      "If you must go: N95, short route",
      "— AirMitra",
    ];
    return lines.join("\n");
  }, [reading]);

  const text = useMemo(
    () =>
      [
        `AirMitra advisory — ${reading.area}, ${reading.state.name}`,
        `AQI ${reading.aqi} (${reading.band.label}), ${reading.dominant} dominant.`,
        `Best time out: ${reading.windows.best}. Avoid: ${reading.windows.avoid}.`,
        reading.guidelines[0],
        reading.guidelines[1],
        `Do now: ${reading.doNow.map((d) => d.title).join("; ")}.`,
        `Source: ${reading.source.station} (${reading.source.updated}).`,
      ].join("\n"),
    [reading],
  );

  async function copyValue(value: string, kind: "status" | "full") {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        legacyCopy(value);
      }
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      try {
        legacyCopy(value);
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 2000);
      } catch {
        setCopied(null);
      }
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "AirMitra status", text: statusText });
      } catch {
        /* cancelled */
      }
    } else {
      await copyValue(statusText, "status");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShareIcon className="h-4 w-4 text-brand" />
          Share card
        </div>
        <p className="mt-1 text-xs text-muted">
          Send to a family or society WhatsApp group. No names or health details in the card.
        </p>
      </div>

      <ShareCardPreview reading={reading} />

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="text-sm font-semibold text-ink">Status / story text</div>
        <p className="mt-1 text-xs leading-5 text-muted">
          Short enough for WhatsApp status or an Instagram story, with the hours
          spelled out.
        </p>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-paper p-3 text-[11px] leading-5 text-ink ring-1 ring-line">
          {statusText}
        </pre>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyValue(statusText, "status")}
            className="rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 active:scale-[0.99]"
          >
            {copied === "status" ? "Copied" : "Copy status"}
          </button>
          <button
            type="button"
            onClick={share}
            className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-paper active:scale-[0.99]"
          >
            Share
          </button>
        </div>
        <button
          type="button"
          onClick={() => copyValue(text, "full")}
          className="mt-2 text-[11px] font-medium text-muted hover:text-ink"
        >
          {copied === "full" ? "Copied full advisory" : "Copy full advisory"}
        </button>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MaskIcon className="h-4 w-4 text-brand" />
          Improve-air card
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          One tap later: a second card with only the home fixes — no AQI, no personal
          detail. For the society group.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

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
        <h3 className="text-sm font-semibold text-ink">Data</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          The current screen uses demo data. Live CPCB, OpenAQ, and CAMS data plug into
          the same layout.
        </p>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted">
          <WindIcon className="h-3.5 w-3.5" />
          No accounts. No community. No data shared.
        </div>
      </section>
    </div>
  );
}

export function PlaceholderPanel({ tab }: { tab: Tab }) {
  return (
    <div className="rounded-2xl bg-card p-6 text-sm text-muted ring-1 ring-black/5">
      {tab} is next in the build.
    </div>
  );
}
