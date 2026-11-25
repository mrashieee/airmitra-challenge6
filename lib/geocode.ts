import { distanceKm } from "./air/geo";
import { ALL_STATES } from "./states";

export type GeoResult = {
  id: number;
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  feature_code?: string;
};

export function nearestStateCode(lat: number, lon: number): string {
  let best = ALL_STATES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const state of ALL_STATES) {
    const d = distanceKm({ lat, lon }, { lat: state.lat, lon: state.lon });
    if (d < bestDistance) {
      best = state;
      bestDistance = d;
    }
  }

  return best.code;
}

export function stateCodeFor(result: {
  admin1?: string;
  latitude: number;
  longitude: number;
}): string {
  const admin = (result.admin1 ?? "").toLowerCase();
  const match = ALL_STATES.find((state) => {
    const name = state.name.toLowerCase().replace(/\s*\(.*\)$/, "");
    return name === admin || admin.includes(name) || name.includes(admin);
  });

  return match?.code ?? nearestStateCode(result.latitude, result.longitude);
}
