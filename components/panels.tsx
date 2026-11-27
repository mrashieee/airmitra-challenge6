"use client";

import { useMemo, useState } from "react";
import type { Reading } from "@/lib/aqi";
import { StoryPreview } from "./share-cards";
import type { Profile } from "@/lib/profile";
import { cn } from "@/lib/ui";
import { slugify } from "@/lib/slug";
import { useT } from "./language-provider";
import { ShareIcon, SparkIcon } from "./icons";



/* ------------------------------------------------------------------ */
/* Ask                                                                 */
/* ------------------------------------------------------------------ */

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  source?: "ai" | "template";
};

function demoAnswer(
  question: string,
  reading: Reading,
  language: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (language === "English") {
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

  return [
    t("ui.share.aqiLine", {
      aqi: reading.aqi,
      band: reading.band.label,
      dominant: reading.dominant,
    }),
    reading.guidelines[0],
    reading.doNow[0] ? `${reading.doNow[0].title}: ${reading.doNow[0].body}` : "",
    t("ui.ask.disclaimer"),
  ]
    .filter(Boolean)
    .join(" ");
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
  const { language, t } = useT();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: t("ui.ask.hello", {
        aqi: reading.aqi,
        band: reading.band.label,
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const suggestions = [
    t("ui.ask.s1"),
    t("ui.ask.s2"),
    t("ui.ask.s3"),
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
          text: demoAnswer(clean, reading, language, t),
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
          {t("ui.ask.title")}
          <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-100">
            AI
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">{t("ui.ask.sub")}</p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          {t("ui.ask.disclaimer")}
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
                {m.source === "ai"
                  ? t("ui.ask.sourceAI")
                  : t("ui.ask.sourceRules")}
              </div>
            ) : null}
          </div>
        ))}
        {pending ? (
          <div className="max-w-[92%] rounded-2xl bg-card px-4 py-3 text-sm text-muted ring-1 ring-black/5">
            <span className="animate-soft">{t("ui.ask.thinking")}</span>
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
          placeholder={t("ui.ask.placeholder")}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 active:scale-[0.99]"
        >
          {t("ui.ask.send")}
        </button>
      </form>
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
  const { t } = useT();
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
          ? t("ui.share.bestTime", { time: reading.windows.best })
          : t("ui.share.leastBadTime", { time: reading.windows.best }),
        t("ui.share.avoid", { time: reading.windows.avoid }),
        t("ui.share.mustGo"),
        reading.helpTheAir[0]
          ? `${t("ui.story.giveBack")}: ${reading.helpTheAir[0].title}`
          : "",
        "— AirMitra",
      ]
        .filter(Boolean)
        .join("\n"),
    [reading, t],
  );

  const caption = `${statusText}\n${pageUrl}`;

  const text = useMemo(
    () =>
      [
        t("ui.share.advisory", {
          city: reading.area,
          state: reading.state.name,
        }),
        t("ui.share.aqiLine", {
          aqi: reading.aqi,
          band: reading.band.label,
          dominant: reading.dominant,
        }),
        reading.aqi > 150
          ? t("ui.share.leastBadTime", { time: reading.windows.best })
          : t("ui.share.bestTime", { time: reading.windows.best }),
        t("ui.share.avoid", { time: reading.windows.avoid }),
        reading.guidelines[0],
        reading.guidelines[1],
        t("ui.share.doNow", {
          items: reading.doNow.map((d) => d.title).join("; "),
        }),
        reading.helpTheAir[0]
          ? `${t("ui.story.giveBack")}: ${reading.helpTheAir[0].title}.`
          : "",
        t("ui.share.source", {
          station: reading.source.station,
          updated: reading.source.updated,
        }),
        pageUrl,
      ]
        .filter(Boolean)
        .join("\n"),
    [reading, pageUrl, t],
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
          {t("ui.cards.story")}
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          {t("ui.cards.storySub")}
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
            {busy ? t("ui.cards.building") : t("ui.cards.download")}
          </button>
          <button
            type="button"
            onClick={shareImage}
            disabled={busy}
            className="rounded-xl bg-card px-4 py-3 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-paper active:scale-[0.99] disabled:opacity-60"
          >
            {t("ui.cards.share")}
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-4 text-muted">
          {t("ui.cards.note")}
        </p>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="font-display text-lg font-semibold text-ink">
          {t("ui.cards.postTo")}
        </div>
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
            {t("ui.cards.instagramNote")}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-black/5">
        <div className="font-display text-lg font-semibold text-ink">
          {t("ui.cards.statusTitle")}
        </div>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-paper p-3 text-[11px] leading-5 text-ink ring-1 ring-line">
          {caption}
        </pre>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyValue(caption, "caption")}
            className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            {copied === "caption" ? t("ui.cards.copied") : t("ui.cards.copyCaption")}
          </button>
          <button
            type="button"
            onClick={() => copyValue(text, "full")}
            className="rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-line transition hover:bg-paper"
          >
            {copied === "full" ? t("ui.cards.copied") : t("ui.cards.copyAdvisory")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
