"use client";

import { cn } from "@/lib/ui";
import { useT } from "./language-provider";
import { HomeIcon, LocateIcon, PinIcon } from "./icons";
import { LocationSelect } from "./location-picker";

export type LocationPoint = {
  stateCode: string;
  city: string;
  lat: number;
  lon: number;
};

export function LocationBar({
  home,
  current,
  locating,
  error,
  onStateChange,
  onSelectLocation,
  onHome,
  onLocate,
  compact = false,
}: {
  home: LocationPoint;
  current: LocationPoint;
  locating: boolean;
  error: string;
  onStateChange: (stateCode: string) => void;
  onSelectLocation: (location: LocationPoint) => void;
  onHome: () => void;
  onLocate: () => void;
  compact?: boolean;
}) {
  const { t } = useT();
  const isHome =
    home.stateCode === current.stateCode && home.city === current.city;

  return (
    <div className={cn("space-y-2", compact ? "mt-3" : "mt-4")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
          <PinIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            <span className="font-medium text-ink">{current.city}</span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1",
              isHome
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200",
            )}
          >
            {t(isHome ? "ui.location.home" : "ui.location.current")}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!isHome ? (
            <button
              type="button"
              onClick={onHome}
              title={t("ui.location.backHome")}
              className="rounded-full bg-card p-1.5 text-muted ring-1 ring-line transition hover:text-ink"
            >
              <HomeIcon className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onLocate}
            disabled={locating}
            title={t("ui.location.useGps")}
            className="rounded-full bg-card p-1.5 text-muted ring-1 ring-line transition hover:text-ink disabled:opacity-60"
          >
            <LocateIcon
              className={cn("h-3.5 w-3.5", locating && "animate-pulse")}
            />
          </button>
        </div>
      </div>

      {locating ? (
        <p className="text-[10px] text-muted">{t("ui.onboarding.finding")}</p>
      ) : null}
      {error ? (
        <p className="text-[10px] leading-4 text-rose-700">{error}</p>
      ) : null}

      <LocationSelect
        code={current.stateCode}
        onStateChange={onStateChange}
        onSelectLocation={onSelectLocation}
        className="mt-2"
      />
    </div>
  );
}
