import messages from "./messages.json";

export type Locale =
  | "en"
  | "hi"
  | "ml"
  | "ta"
  | "te"
  | "kn"
  | "mr"
  | "bn"
  | "gu"
  | "pa"
  | "or"
  | "ur"
  | "as";

export type LanguageOption = {
  code: Locale;
  /** Stored value in the profile. */
  name: string;
  /** Name in the language itself, for the picker. */
  native: string;
  tag: string;
  dir: "ltr" | "rtl";
};

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", tag: "en-IN", dir: "ltr" },
  { code: "hi", name: "Hindi", native: "हिन्दी", tag: "hi-IN", dir: "ltr" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", tag: "ml-IN", dir: "ltr" },
  { code: "ta", name: "Tamil", native: "தமிழ்", tag: "ta-IN", dir: "ltr" },
  { code: "te", name: "Telugu", native: "తెలుగు", tag: "te-IN", dir: "ltr" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", tag: "kn-IN", dir: "ltr" },
  { code: "mr", name: "Marathi", native: "मराठी", tag: "mr-IN", dir: "ltr" },
  { code: "bn", name: "Bengali", native: "বাংলা", tag: "bn-IN", dir: "ltr" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", tag: "gu-IN", dir: "ltr" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", tag: "pa-IN", dir: "ltr" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", tag: "or-IN", dir: "ltr" },
  { code: "ur", name: "Urdu", native: "اردو", tag: "ur-IN", dir: "rtl" },
  { code: "as", name: "Assamese", native: "অসমীয়া", tag: "as-IN", dir: "ltr" },
];

const BY_NAME = new Map(
  LANGUAGES.flatMap((entry) => [
    [entry.name.toLowerCase(), entry],
    [entry.code, entry],
    [entry.native.toLowerCase(), entry],
  ]),
);

export function languageOption(language: string): LanguageOption {
  return BY_NAME.get(language.toLowerCase()) ?? LANGUAGES[0];
}

export function localeFor(language: string): Locale {
  return languageOption(language).code;
}

export function nativeFor(language: string): string {
  return languageOption(language).native;
}

export function localeTag(language: string): string {
  return languageOption(language).tag;
}

export function directionFor(language: string): "ltr" | "rtl" {
  return languageOption(language).dir;
}

type Messages = Record<string, Record<string, string>>;
const DICT = messages as Messages;

/**
 * Look up a UI or reading string in the chosen language.
 * Falls back to English, then to the key itself.
 */
export function t(
  language: string,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const locale = localeFor(language);
  const value =
    DICT[locale]?.[key] ??
    DICT.en?.[key] ??
    key;

  if (!vars) return value;

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : match,
  );
}

/** Translate a stored option value (e.g. "Father", "Severe") for display. */
export function optionLabel(
  language: string,
  group: "relation" | "condition" | "severity",
  value: string,
): string {
  const slug = value
    .toLowerCase()
    .replace(/[\s/_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
  const key = `option.${group}.${slug}`;
  return t(language, key);
}

/**
 * Translate any stored setup value (home type, fuel, commute, age band...) for
 * display while keeping the canonical English value in the profile.
 */
export function choiceLabel(language: string, value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/&/g, "and")
    .replace(/[\s/_-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
  return t(language, `choice.${slug}`);
}

export function bandLabel(language: string, key: string): string {
  return t(language, `band.${key}`);
}

/** "2 nearest monitors · median" -> localized "Median of 2 monitors". */
export function stationLabel(language: string, station: string): string {
  const match = station.match(
    /^(\d+) (?:nearest monitors|official stations) · median$/,
  );
  if (match) {
    return t(language, "ui.share.median", { n: match[1] });
  }
  return station;
}
