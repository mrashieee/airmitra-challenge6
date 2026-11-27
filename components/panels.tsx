"use client";

import { useMemo, useState } from "react";
import type { Reading } from "@/lib/aqi";
import { StoryPreview } from "./share-cards";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/ui";
import { slugify } from "@/lib/slug";
import {
  AlertIcon,
  CheckIcon,
  ShareIcon,
  SparkIcon,
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
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
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
        <p className="mt-1 text-[10px] leading-4 text-muted">
          AI-generated. Can be wrong. Not medical advice.
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

export function ReportPanel({ reading }: { reading: Reading }) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState("Mild");
  const [issues, setIssues] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const redFlag =
    severity === "Severe" &&
    (symptoms.includes("Breathless") || symptoms.includes("Chest tightness"));

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <AlertIcon className="h-4 w-4 text-brand" />
          Tell us what is going on
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          Optional and private to this device. It is never a diagnosis and is
          not sent to a doctor or agency.
        </p>
      </div>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <h3 className="font-display text-lg font-semibold text-ink">How is someone feeling?</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(symptoms, s, setSymptoms)}
              aria-pressed={symptoms.includes(s)}
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
              aria-pressed={severity === s}
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
        <h3 className="font-display text-lg font-semibold text-ink">Report a local issue</h3>
        <p className="mt-1 text-xs leading-5 text-muted">
          Save it here, then copy a complaint draft you can send to your
          municipality or society.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ISSUES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(issues, s, setIssues)}
              aria-pressed={issues.includes(s)}
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
        onClick={async () => {
          const record = {
            date: new Date().toISOString(),
            symptoms,
            severity,
            issues,
          };
          try {
            window.localStorage.setItem(
              "airmitra.report.v1",
              JSON.stringify(record),
            );
          } catch {
            // storage blocked — still show the saved state for this session
          }
          setSaved(true);
        }}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e] active:scale-[0.99]"
      >
        Save on this device
      </button>

      {saved ? (
        <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-900 ring-1 ring-teal-100">
          <div className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Saved on this device. Nothing is uploaded and it is not a medical
              record.
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              const draft = [
                `Air quality complaint — ${new Date().toLocaleDateString("en-IN")}`,
                `${reading.area}, ${reading.state.name} · AQI ${reading.aqi} (${reading.band.label})`,
                `Monitor: ${reading.source.station}`,
                issues.length ? `Local issues: ${issues.join(", ")}` : "",
                symptoms.length
                  ? `Health noted: ${symptoms.join(", ")} (${severity})`
                  : "",
                "Requested action: please inspect the source and reduce exposure.",
                "Reported via AirMitra",
              ]
                .filter(Boolean)
                .join("\n");

              try {
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(draft);
                } else {
                  legacyCopy(draft);
                }
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                legacyCopy(draft);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="mt-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-teal-900 ring-1 ring-teal-200"
          >
            {copied ? "Copied complaint draft" : "Copy complaint draft"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

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
  const [copied, setCopied] = useState<"status" | "caption" | "full" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [instagramNote, setInstagramNote] = useState(false);

  const site =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://airmitra-app.vercel.app";
  const pageUrl = `${site}/aqi/${slugify(reading.state.name)}/${slugify(reading.area)}`;

  const statusText = useMemo(
    () =>
      [
        `${reading.area} · AQI ${reading.aqi} (${reading.band.label})`,
        reading.aqi <= 150
          ? `Best time out: ${reading.windows.best}`
          : `Least-bad time out: ${reading.windows.best} — mask still advised`,
        `Avoid outdoors: ${reading.windows.avoid}`,
        "If you must go: N95, short route",
        "— AirMitra",
      ].join("\n"),
    [reading],
  );

  const caption = `${statusText}\n${pageUrl}`;

  const text = useMemo(
    () =>
      [
        `AirMitra advisory — ${reading.area}, ${reading.state.name}`,
        `AQI ${reading.aqi} (${reading.band.label}), ${reading.dominant} dominant.`,
        `${reading.aqi > 150 ? "Least-bad" : "Best"} time out: ${reading.windows.best}. Avoid: ${reading.windows.avoid}.`,
        reading.guidelines[0],
        reading.guidelines[1],
        `Do now: ${reading.doNow.map((d) => d.title).join("; ")}.`,
        `Source: ${reading.source.station} (${reading.source.updated}).`,
        pageUrl,
      ].join("\n"),
    [reading, pageUrl],
  );

  async function copyValue(value: string, kind: "status" | "caption" | "full") {
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

  async function storyBlob(): Promise<Blob> {
    const { renderStoryImage } = await import("@/lib/story-image");
    return renderStoryImage(reading);
  }

  async function downloadStory() {
    setBusy(true);
    try {
      const blob = await storyBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `airmitra-${slugify(reading.area)}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    setBusy(true);
    try {
      const blob = await storyBlob();
      const file = new File([blob], `airmitra-${slugify(reading.area)}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: statusText });
      } else {
        await downloadStory();
      }
    } catch {
      /* cancelled */
    } finally {
      setBusy(false);
    }
  }

  async function instagram() {
    await downloadStory();
    await copyValue(caption, "caption");
    setInstagramNote(true);
    window.setTimeout(() => setInstagramNote(false), 6000);
  }

  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(caption)}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(statusText)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(statusText)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
          <ShareIcon className="h-4 w-4 text-brand" />
          Story card
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          A 9:16 image for WhatsApp status or Instagram, plus ready-made text.
          No names or health details.
        </p>
        <div className="mt-4">
          <StoryPreview reading={reading} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={downloadStory}
            disabled={busy}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0a4a3e] active:scale-[0.99] disabled:opacity-60"
          >
            {busy ? "Building…" : "Download image"}
          </button>
          <button
            type="button"
            onClick={shareImage}
            disabled={busy}
            className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-paper active:scale-[0.99] disabled:opacity-60"
          >
            Share image
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-muted">
          Image is 1080×1920 PNG. On a phone, “Share image” opens the native
          share sheet, including Instagram.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="font-display text-lg font-semibold text-ink">Post to</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-paper px-2 py-2.5 text-center text-[11px] font-medium text-ink ring-1 ring-line transition hover:bg-white"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={instagram}
            className="rounded-xl bg-paper px-2 py-2.5 text-center text-[11px] font-medium text-ink ring-1 ring-line transition hover:bg-white"
          >
            Instagram
          </button>
        </div>
        {instagramNote ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-[11px] leading-5 text-emerald-800 ring-1 ring-emerald-200">
            Image downloaded and caption copied. Open Instagram → Add to story
            → choose the image.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="font-display text-lg font-semibold text-ink">Status / story text</div>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-paper p-3 text-[11px] leading-5 text-ink ring-1 ring-line">
          {caption}
        </pre>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyValue(caption, "caption")}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {copied === "caption" ? "Copied" : "Copy caption"}
          </button>
          <button
            type="button"
            onClick={() => copyValue(text, "full")}
            className="rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-paper"
          >
            {copied === "full" ? "Copied" : "Copy advisory"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
