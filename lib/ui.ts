import type { BandKey } from "./aqi";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const BAND_STYLES: Record<
  BandKey,
  { text: string; soft: string; ring: string; dot: string; solid: string }
> = {
  good: {
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    solid: "bg-emerald-600",
  },
  satisfactory: {
    text: "text-lime-700",
    soft: "bg-lime-50",
    ring: "ring-lime-200",
    dot: "bg-lime-500",
    solid: "bg-lime-600",
  },
  moderate: {
    text: "text-amber-700",
    soft: "bg-amber-50",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    solid: "bg-amber-500",
  },
  poor: {
    text: "text-orange-700",
    soft: "bg-orange-50",
    ring: "ring-orange-200",
    dot: "bg-orange-500",
    solid: "bg-orange-600",
  },
  veryPoor: {
    text: "text-red-700",
    soft: "bg-red-50",
    ring: "ring-red-200",
    dot: "bg-red-500",
    solid: "bg-red-600",
  },
  severe: {
    text: "text-rose-900",
    soft: "bg-rose-50",
    ring: "ring-rose-200",
    dot: "bg-rose-700",
    solid: "bg-rose-800",
  },
};
