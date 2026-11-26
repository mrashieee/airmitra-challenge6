"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui";

/**
 * The headline AQI number: counts up when it first appears or when the value
 * changes, so a data refresh reads as a change rather than a jump cut.
 * Respects prefers-reduced-motion.
 */
export function AqiNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (from === value) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduce ? 1 : 650;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span
      key={value}
      className={cn("tabular inline-block animate-aqi-pop", className)}
    >
      {display}
    </span>
  );
}
