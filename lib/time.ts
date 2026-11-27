export type DayPeriod = "morning" | "afternoon" | "evening" | "night";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Hour of day in India, regardless of the server or browser timezone. */
export function indiaHour(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
  return Number(hour) % 24;
}

export function periodFor(now: Date = new Date()): DayPeriod {
  const hour = indiaHour(now);
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
}

/** Stable day number in IST, used to rotate daily give-back ideas. */
export function istDayIndex(now: Date = new Date()): number {
  return Math.floor((now.getTime() + IST_OFFSET_MS) / 86_400_000);
}
