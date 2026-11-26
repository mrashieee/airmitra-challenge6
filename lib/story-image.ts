import type { Reading } from "@/lib/aqi";
import { slugify } from "@/lib/slug";

const ACCENTS: Record<string, string> = {
  good: "#34d399",
  satisfactory: "#a3e635",
  moderate: "#fbbf24",
  poor: "#fb923c",
  veryPoor: "#f87171",
  severe: "#fb7185",
};

const FONT = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 4) {
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last.trim()}…`;
  return kept;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Renders a 1080x1920 story image for WhatsApp status / Instagram. */
export async function renderStoryImage(reading: Reading): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  const accent = ACCENTS[reading.band.key] ?? ACCENTS.good;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#052a26");
  bg.addColorStop(0.55, "#0a3b36");
  bg.addColorStop(1, "#0f2b29");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent glow
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, W * 0.95);
  glow.addColorStop(0, hexToRgba(accent, 0.38));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const margin = 88;
  const maxWidth = W - margin * 2;

  // Header
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText("AirMitra", margin, 148);

  ctx.fillStyle = "rgba(204, 251, 241, 0.7)";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText("HOUSEHOLD AIR COACH", margin, 186);

  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(204, 251, 241, 0.75)";
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText(date, W - margin, 148);
  ctx.textAlign = "left";

  // City
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 82px ${FONT}`;
  const cityLines = wrap(ctx, reading.area, maxWidth, 2);
  let y = 330;
  for (const line of cityLines) {
    ctx.fillText(line, margin, y);
    y += 92;
  }

  ctx.fillStyle = "rgba(204, 251, 241, 0.75)";
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText(reading.state.name, margin, y);
  y += 60;

  // AQI + band
  const aqiY = y + 210;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 250px ${FONT}`;
  const aqiText = String(reading.aqi);
  ctx.fillText(aqiText, margin, aqiY);
  const aqiWidth = ctx.measureText(aqiText).width;

  ctx.font = `600 34px ${FONT}`;
  const bandLabel = reading.band.label;
  const pillWidth = ctx.measureText(bandLabel).width + 56;
  const pillX = margin + aqiWidth + 34;
  const pillY = aqiY - 78;
  ctx.fillStyle = hexToRgba(accent, 0.18);
  roundRect(ctx, pillX, pillY, pillWidth, 62, 31);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(accent, 0.55);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.fillText(bandLabel, pillX + 28, pillY + 42);

  y = aqiY + 70;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `500 30px ${FONT}`;
  const dominantValue = reading.pollutants.find(
    (p) => p.label === reading.dominant,
  )?.value;
  ctx.fillText(
    `${reading.dominant}${
      dominantValue !== undefined ? ` ${dominantValue} µg/m³` : ""
    } dominant`,
    margin,
    y,
  );

  // Divider
  y += 56;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(W - margin, y);
  ctx.stroke();

  // Windows
  y += 68;
  const windowBlock = (label: string, value: string, color: string) => {
    ctx.fillStyle = "rgba(204,251,241,0.65)";
    ctx.font = `600 24px ${FONT}`;
    ctx.fillText(label.toUpperCase(), margin, y);
    y += 52;
    ctx.fillStyle = color;
    ctx.font = `700 60px ${FONT}`;
    for (const line of wrap(ctx, value, maxWidth, 2)) {
      ctx.fillText(line, margin, y);
      y += 64;
    }
    y += 26;
  };

  windowBlock(
    reading.aqi > 150 ? "Least-bad time out" : "Best time out",
    reading.windows.best,
    "#ffffff",
  );
  windowBlock("Avoid outdoors", reading.windows.avoid, "rgba(255,255,255,0.82)");

  // Do now
  ctx.fillStyle = "rgba(204,251,241,0.65)";
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText("DO NOW", margin, y);
  y += 50;

  ctx.font = `500 34px ${FONT}`;
  for (const item of reading.doNow.slice(0, 3)) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(margin + 8, y - 12, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (const line of wrap(ctx, item.title, maxWidth - 40, 2)) {
      ctx.fillText(line, margin + 34, y);
      y += 44;
    }
    y += 18;
  }

  // Impact payoff
  const boxY = Math.min(y + 22, 1450);
  const boxHeight = 188;
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  roundRect(ctx, margin, boxY, maxWidth, boxHeight, 28);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(204,251,241,0.7)";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText("IMPACT", margin + 32, boxY + 46);

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 46px ${FONT}`;
  ctx.fillText(reading.impact.value, margin + 32, boxY + 102);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `500 26px ${FONT}`;
  const impactTitle = wrap(ctx, reading.impact.title, maxWidth - 64, 1)[0];
  ctx.fillText(impactTitle, margin + 32, boxY + 138);

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(
    "If you must go out: fitted N95, short route",
    margin + 32,
    boxY + 172,
  );

  // Source line above the footer
  const source = `${
    reading.source.type === "ground" ? "Ground monitor" : "CAMS model estimate"
  } · ${reading.source.updated}`;
  ctx.fillStyle = "rgba(204,251,241,0.55)";
  ctx.font = `500 22px ${FONT}`;
  const sourceLine = wrap(ctx, source, maxWidth, 1)[0];
  ctx.fillText(sourceLine, margin, H - 236);

  // Footer
  const footerY = H - 150;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, footerY - 46);
  ctx.lineTo(W - margin, footerY - 46);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `600 32px ${FONT}`;
  ctx.fillText("Check the air before you go out", margin, footerY + 10);

  ctx.fillStyle = "rgba(204,251,241,0.7)";
  let urlSize = 26;
  ctx.font = `500 ${urlSize}px ${FONT}`;
  const cityUrl = `airmitra-app.vercel.app/aqi/${slugify(reading.state.name)}/${slugify(reading.area)}`;
  while (ctx.measureText(cityUrl).width > maxWidth && urlSize > 17) {
    urlSize -= 2;
    ctx.font = `500 ${urlSize}px ${FONT}`;
  }
  ctx.fillText(cityUrl, margin, footerY + 56);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not render"))),
      "image/png",
      0.95,
    );
  });
}
