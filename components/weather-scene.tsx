import type { WeatherCondition } from "@/lib/air/types";
import { cn } from "@/lib/ui";

const GRADIENTS: Record<WeatherCondition, string> = {
  clear: "from-amber-100 via-orange-50 to-sky-100",
  partly: "from-sky-100 via-white to-amber-50",
  cloudy: "from-slate-400 via-slate-300 to-slate-200",
  fog: "from-slate-100 via-white to-slate-200",
  drizzle: "from-slate-200 via-sky-100 to-slate-200",
  rain: "from-slate-300 via-sky-200 to-slate-300",
  thunder: "from-slate-400 via-indigo-200 to-slate-300",
  snow: "from-sky-100 via-white to-slate-200",
};

export function weatherLabel(condition: WeatherCondition, isDay: boolean) {
  if (condition === "clear") return isDay ? "Sunny" : "Clear night";
  if (condition === "partly") return "Partly cloudy";
  if (condition === "cloudy") return "Cloudy";
  if (condition === "fog") return "Fog";
  if (condition === "drizzle") return "Drizzle";
  if (condition === "rain") return "Rain";
  if (condition === "thunder") return "Thunder";
  return "Snow";
}

export function WeatherScene({
  condition,
  isDay,
  aqi,
}: {
  condition: WeatherCondition;
  isDay: boolean;
  aqi: number;
}) {
  const showSun = isDay && (condition === "clear" || condition === "partly");
  const showMoon = !isDay && condition === "clear";
  const showClouds = ["partly", "cloudy", "fog", "drizzle", "rain", "thunder"].includes(
    condition,
  );
  const showRain = ["drizzle", "rain", "thunder"].includes(condition);
  const showFog = condition === "fog";
  const showStars = !isDay && (condition === "clear" || condition === "partly");

  return (
    <div
      aria-hidden
      className={cn(
        "animate-scene pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br",
        GRADIENTS[condition],
      )}
    >
      {showSun ? (
        <>
          <div className="animate-glow absolute -right-16 -top-20 h-64 w-64 rounded-full bg-amber-200/50 blur-3xl" />
          <div className="animate-sun absolute -right-12 -top-14 h-52 w-52 rounded-full bg-amber-300/40 blur-2xl" />
          <div
            className="animate-spin-slow absolute -right-2 -top-4 h-40 w-40 rounded-full opacity-60 blur-[1px]"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(251,191,36,0.45) 0deg 7deg, transparent 7deg 32deg)",
            }}
          />
          <div className="animate-float absolute right-7 top-5 h-16 w-16 rounded-full bg-amber-200/90 shadow-[0_0_64px_rgba(251,191,36,0.55)]" />
        </>
      ) : null}

      {showMoon ? (
        <>
          <div className="animate-sun absolute -right-10 -top-12 h-48 w-48 rounded-full bg-indigo-200/40 blur-2xl" />
          <div className="animate-float absolute right-8 top-5 h-14 w-14 rounded-full bg-slate-50/95 shadow-[0_0_48px_rgba(226,232,240,0.8)]" />
        </>
      ) : null}

      {showStars
        ? Array.from({ length: 10 }).map((_, index) => (
            <span
              key={index}
              className="animate-twinkle absolute h-1 w-1 rounded-full bg-white/90"
              style={{
                left: `${8 + index * 9}%`,
                top: `${8 + (index % 4) * 12}%`,
                animationDelay: `${index * 0.28}s`,
              }}
            />
          ))
        : null}

      {condition === "cloudy" ? (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-500/25 via-transparent to-transparent" />
      ) : null}

      {showClouds ? (
        <>
          <div className="animate-cloud absolute -left-10 top-6">
            <div className="relative h-16 w-48">
              <div className="absolute bottom-0 h-9 w-48 rounded-full bg-white/70 blur-[2px]" />
              <div className="absolute bottom-4 left-4 h-12 w-16 rounded-full bg-white/75 blur-[1px]" />
              <div className="absolute bottom-3 left-20 h-10 w-16 rounded-full bg-white/65 blur-[1px]" />
            </div>
          </div>
          <div className="animate-cloud absolute -right-8 top-24 [animation-delay:2.5s] [animation-duration:18s]">
            <div className="relative h-12 w-36">
              <div className="absolute bottom-0 h-7 w-36 rounded-full bg-white/55 blur-[2px]" />
              <div className="absolute bottom-3 left-4 h-9 w-14 rounded-full bg-white/60 blur-[1px]" />
            </div>
          </div>
          <div className="animate-cloud absolute -left-16 top-2 scale-75 opacity-70 [animation-delay:7s] [animation-duration:26s]">
            <div className="relative h-10 w-40">
              <div className="absolute bottom-0 h-6 w-40 rounded-full bg-white/45 blur-[3px]" />
              <div className="absolute bottom-2 left-6 h-8 w-16 rounded-full bg-white/50 blur-[2px]" />
            </div>
          </div>
          {condition !== "partly" ? (
            <div className="animate-cloud absolute left-10 top-32 [animation-delay:5s] [animation-duration:22s]">
              <div className="relative h-10 w-28">
                <div className="absolute bottom-0 h-6 w-28 rounded-full bg-white/45 blur-[2px]" />
                <div className="absolute bottom-2 left-3 h-8 w-12 rounded-full bg-white/50 blur-[1px]" />
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {showRain ? (
        <>
          <div className="absolute inset-0">
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                className="animate-rain absolute top-0 h-6 w-px bg-sky-800/45"
                style={{
                  left: `${(index * 5 + 3) % 100}%`,
                  animationDelay: `${(index % 9) * 0.14}s`,
                  animationDuration: `${0.55 + (index % 4) * 0.12}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0">
            {Array.from({ length: 14 }).map((_, index) => (
              <span
                key={index}
                className="animate-rain absolute top-0 h-3 w-px bg-sky-600/25"
                style={{
                  left: `${(index * 8 + 9) % 100}%`,
                  animationDelay: `${(index % 6) * 0.22}s`,
                  animationDuration: `${0.9 + (index % 3) * 0.18}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/35 to-transparent" />
        </>
      ) : null}

      {showFog ? (
        <>
          <div className="animate-fog absolute left-0 top-16 h-12 w-[140%] rounded-full bg-white/60 blur-2xl" />
          <div className="animate-fog absolute -left-10 top-28 h-10 w-[130%] rounded-full bg-white/45 blur-2xl [animation-delay:3s]" />
        </>
      ) : null}

      {condition === "thunder" ? (
        <div className="animate-flash absolute inset-0 bg-indigo-100/70" />
      ) : null}

      {condition === "snow" ? (
        <div className="absolute inset-0">
          {Array.from({ length: 14 }).map((_, index) => (
            <span
              key={index}
              className="animate-snow absolute h-1.5 w-1.5 rounded-full bg-white/80"
              style={{
                left: `${(index * 8 + 6) % 100}%`,
                animationDelay: `${(index % 5) * 0.4}s`,
                animationDuration: `${2.4 + (index % 3) * 0.6}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* AQI haze: subtle, never overpowers the weather */}
      {aqi > 300 ? <div className="absolute inset-0 bg-red-900/10" /> : null}
      {aqi > 200 && aqi <= 300 ? (
        <div className="absolute inset-0 bg-orange-900/5" />
      ) : null}

      {/* Readability veil */}
      <div className="absolute inset-0 bg-white/15" />
    </div>
  );
}
