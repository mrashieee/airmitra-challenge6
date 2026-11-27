import type { WeatherCondition } from "@/lib/air/types";
import { cn } from "@/lib/ui";
const DAY_GRADIENTS: Record<WeatherCondition, string> = {
  clear: "from-[#fde68a] via-[#fef3c7] to-[#7dd3fc]",
  partly: "from-[#bae6fd] via-[#e0f2fe] to-[#fde68a]",
  cloudy: "from-[#cbd5e1] via-[#e2e8f0] to-[#bae6fd]",
  fog: "from-[#e2e8f0] via-[#f1f5f9] to-[#cbd5e1]",
  drizzle: "from-[#cbd5e1] via-[#bae6fd] to-[#cbd5e1]",
  rain: "from-[#64748b] via-[#94a3b8] to-[#38bdf8]",
  thunder: "from-[#475569] via-[#6366f1] to-[#64748b]",
  snow: "from-[#e0f2fe] via-white to-[#cbd5e1]",
};

const NIGHT_GRADIENTS: Record<WeatherCondition, string> = {
  clear: "from-[#070b18] via-[#0f1730] to-[#1e2a4a]",
  partly: "from-[#0a1024] via-[#152040] to-[#26324f]",
  cloudy: "from-[#0f172a] via-[#1e293b] to-[#111827]",
  fog: "from-[#1e293b] via-[#334155] to-[#1e293b]",
  drizzle: "from-[#0b1220] via-[#1e293b] to-[#0b1220]",
  rain: "from-[#0b1220] via-[#1e293b] to-[#0b1220]",
  thunder: "from-[#080c18] via-[#312e81] to-[#0f172a]",
  snow: "from-[#0f172a] via-[#1e293b] to-[#334155]",
};

export function WeatherScene({
  condition,
  isDay,
  aqi,
}: {
  condition: WeatherCondition;
  isDay: boolean;
  aqi: number;
}) {
  const night = !isDay;
  const showSun = isDay && (condition === "clear" || condition === "partly");
  const showMoon = night && (condition === "clear" || condition === "partly");
  const showStars = night && (condition === "clear" || condition === "partly");
  const showClouds = [
    "partly",
    "cloudy",
    "fog",
    "drizzle",
    "rain",
    "thunder",
  ].includes(condition);
  const showRain = ["drizzle", "rain", "thunder"].includes(condition);
  const showFog = condition === "fog";

  return (
    <div
      aria-hidden
      className={cn(
        "weather-scene animate-scene pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-br transition-colors duration-1000",
        night ? NIGHT_GRADIENTS[condition] : DAY_GRADIENTS[condition],
      )}
    >
      {/* Day: sun with rotating rays + breathing halo */}
      {showSun ? (
        <>
          <div className="absolute -end-4 -top-6 h-64 w-64 sm:-end-8 sm:-top-8">
            <div className="animate-glow absolute inset-6 rounded-full bg-amber-200/60 blur-3xl" />
            <div className="sun-rays animate-spin-slow absolute inset-0 rounded-full opacity-80" />
            <div className="animate-float absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_80px_rgba(251,191,36,0.85)]" />
          </div>
          <div className="absolute -end-24 top-12 h-40 w-[60%] rotate-[24deg] bg-gradient-to-b from-amber-100/40 to-transparent blur-2xl" />
        </>
      ) : null}

      {/* Night: moon + halo */}
      {showMoon ? (
        <>
          <div className="animate-glow absolute -end-16 -top-20 z-[1] h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />
          <div className="weather-moon animate-float absolute end-6 top-6 z-[2] h-16 w-16 rounded-full bg-[radial-gradient(circle_at_34%_28%,#ffffff_0%,#f8fafc_45%,#d5dee8_100%)] shadow-[0_0_46px_rgba(226,232,240,0.9),0_0_110px_rgba(148,163,184,0.4)] sm:end-8">
            <span className="absolute left-4 top-5 h-2.5 w-2.5 rounded-full bg-slate-400/35" />
            <span className="absolute right-4 top-3 h-1.5 w-1.5 rounded-full bg-slate-400/30" />
            <span className="absolute bottom-4 left-6 h-2 w-2 rounded-full bg-slate-400/25" />
          </div>
        </>
      ) : null}

      {/* Night: stars + one shooting star */}
      {showStars ? (
        <>
          {Array.from({ length: 26 }).map((_, index) => (
            <span
              key={`star-${index}`}
              className="animate-twinkle absolute rounded-full bg-white"
              style={{
                left: `${(index * 37) % 96}%`,
                top: `${(index * 23) % 70}%`,
                height: index % 5 === 0 ? "2.5px" : "1.5px",
                width: index % 5 === 0 ? "2.5px" : "1.5px",
                animationDelay: `${(index % 9) * 0.35}s`,
                animationDuration: `${2.4 + (index % 4) * 0.7}s`,
                opacity: index % 3 === 0 ? 0.9 : 0.55,
              }}
            />
          ))}
          <span className="animate-shoot absolute left-[18%] top-[12%] h-px w-16 bg-gradient-to-r from-white/0 via-white/90 to-white/0" />
          <span className="animate-shoot absolute left-[52%] top-[4%] h-px w-10 bg-gradient-to-r from-white/0 via-white/70 to-white/0 [animation-delay:5s]" />
        </>
      ) : null}

      {/* Clouds: shared day/night, stronger at night with a moonlit edge */}
      {showClouds ? (
        <>
          <div className="animate-cloud absolute -left-16 top-4 scale-90">
            <div className="relative h-20 w-56">
              <div
                className={cn(
                  "absolute bottom-0 h-11 w-56 rounded-full blur-[2px]",
                  night ? "bg-slate-300/25" : "bg-white/80",
                )}
              />
              <div
                className={cn(
                  "absolute bottom-5 left-5 h-14 w-20 rounded-full blur-[1px]",
                  night ? "bg-slate-200/30" : "bg-white/85",
                )}
              />
              <div
                className={cn(
                  "absolute bottom-4 left-24 h-11 w-20 rounded-full blur-[1px]",
                  night ? "bg-slate-200/25" : "bg-white/75",
                )}
              />
            </div>
          </div>

          <div className="animate-cloud absolute -right-12 top-24 [animation-delay:2.5s] [animation-duration:18s]">
            <div className="relative h-14 w-44">
              <div
                className={cn(
                  "absolute bottom-0 h-8 w-44 rounded-full blur-[2px]",
                  night ? "bg-slate-300/20" : "bg-white/65",
                )}
              />
              <div
                className={cn(
                  "absolute bottom-3 left-5 h-10 w-16 rounded-full blur-[1px]",
                  night ? "bg-slate-200/25" : "bg-white/70",
                )}
              />
            </div>
          </div>

          {condition !== "partly" ? (
            <>
              <div className="animate-cloud absolute left-8 top-32 [animation-delay:5s] [animation-duration:22s]">
                <div className="relative h-12 w-36">
                  <div
                    className={cn(
                      "absolute bottom-0 h-7 w-36 rounded-full blur-[2px]",
                      night ? "bg-slate-300/20" : "bg-white/55",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute bottom-2 left-4 h-9 w-14 rounded-full blur-[1px]",
                      night ? "bg-slate-200/25" : "bg-white/60",
                    )}
                  />
                </div>
              </div>
              <div className="animate-cloud absolute -right-20 top-10 scale-75 opacity-70 [animation-delay:8s] [animation-duration:28s]">
                <div className="relative h-10 w-40">
                  <div
                    className={cn(
                      "absolute bottom-0 h-6 w-40 rounded-full blur-[3px]",
                      night ? "bg-slate-300/15" : "bg-white/45",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute bottom-2 left-6 h-8 w-16 rounded-full blur-[2px]",
                      night ? "bg-slate-200/20" : "bg-white/50",
                    )}
                  />
                </div>
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {/* Rain */}
      {showRain ? (
        <>
          <div className="absolute inset-0">
            {Array.from({ length: 34 }).map((_, index) => (
              <span
                key={`rain-a-${index}`}
                className={cn(
                  "animate-rain absolute top-0 h-7 w-px",
                  night ? "bg-sky-200/45" : "bg-sky-900/40",
                )}
                style={{
                  left: `${(index * 7 + 3) % 100}%`,
                  animationDelay: `${(index % 11) * 0.12}s`,
                  animationDuration: `${0.5 + (index % 4) * 0.1}s`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0">
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={`rain-b-${index}`}
                className={cn(
                  "animate-rain absolute top-0 h-4 w-px",
                  night ? "bg-sky-300/25" : "bg-white/45",
                )}
                style={{
                  left: `${(index * 11 + 9) % 100}%`,
                  animationDelay: `${(index % 7) * 0.2}s`,
                  animationDuration: `${0.9 + (index % 3) * 0.16}s`,
                }}
              />
            ))}
          </div>
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent",
              night ? "from-black/40" : "from-white/35",
            )}
          />
        </>
      ) : null}

      {/* Fog */}
      {showFog ? (
        <>
          <div
            className={cn(
              "animate-fog absolute left-0 top-14 h-14 w-[150%] rounded-full blur-2xl",
              night ? "bg-slate-200/25" : "bg-white/70",
            )}
          />
          <div
            className={cn(
              "animate-fog absolute -left-10 top-28 h-12 w-[140%] rounded-full blur-2xl [animation-delay:3s]",
              night ? "bg-slate-200/20" : "bg-white/55",
            )}
          />
          <div
            className={cn(
              "animate-fog absolute -left-16 top-40 h-10 w-[130%] rounded-full blur-2xl [animation-delay:6s]",
              night ? "bg-slate-300/15" : "bg-white/40",
            )}
          />
        </>
      ) : null}

      {/* Thunder flash */}
      {condition === "thunder" ? (
        <div
          className={cn(
            "animate-flash absolute inset-0",
            night ? "bg-indigo-200/40" : "bg-indigo-100/70",
          )}
        />
      ) : null}

      {/* Snow */}
      {condition === "snow" ? (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={`snow-${index}`}
              className="animate-snow absolute h-1.5 w-1.5 rounded-full bg-white/85"
              style={{
                left: `${(index * 8 + 6) % 100}%`,
                animationDelay: `${(index % 6) * 0.35}s`,
                animationDuration: `${2.4 + (index % 3) * 0.6}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Night aurora wash */}
      {night ? (
        <div className="animate-aurora absolute -left-1/4 top-1/3 h-40 w-[90%] rounded-full bg-indigo-400/20 blur-3xl" />
      ) : null}

      {/* AQI tint */}
      {aqi > 300 ? (
        <div className={cn("absolute inset-0", night ? "bg-red-900/25" : "bg-red-900/10")} />
      ) : null}
      {aqi > 200 && aqi <= 300 ? (
        <div className={cn("absolute inset-0", night ? "bg-orange-900/20" : "bg-orange-900/5")} />
      ) : null}

      {/* Readability veil: light on day, dark on night */}
      <div
        className={cn(
          "absolute inset-0",
          night
            ? "bg-gradient-to-b from-black/10 via-transparent to-black/35"
            : "bg-white/15",
        )}
      />
    </div>
  );
}
