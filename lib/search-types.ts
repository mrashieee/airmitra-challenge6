export type CitySuggestion = {
  id: number | string;
  name: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  /** Ground monitor known to cover this place. Null means model-only. */
  monitor?: "CPCB" | "OPENAQ" | null;
  station?: string | null;
  /** True when the place came from live geocoding, not the curated index. */
  approximate?: boolean;
  /** GeoNames/OSM feature code, used to keep settlements only. */
  feature_code?: string;
};

export type CrossStateSuggestion = CitySuggestion & {
  stateCode: string;
  stateName: string;
};
