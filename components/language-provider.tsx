"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  directionFor,
  localeFor,
  nativeFor,
  t as translate,
} from "@/lib/i18n";

type LanguageContextValue = {
  /** Stored profile language name, e.g. "Malayalam". */
  language: string;
  /** BCP-47-ish locale code, e.g. "ml". */
  locale: string;
  /** Native name, e.g. "മലയാളം". */
  native: string;
  dir: "ltr" | "rtl";
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const FALLBACK: LanguageContextValue = {
  language: "English",
  locale: "en",
  native: "English",
  dir: "ltr",
  t: (key, vars) => translate("English", key, vars),
};

const LanguageContext = createContext<LanguageContextValue>(FALLBACK);

export function LanguageProvider({
  language,
  children,
}: {
  language: string;
  children: ReactNode;
}) {
  const value = useMemo<LanguageContextValue>(() => {
    const locale = localeFor(language);
    return {
      language,
      locale,
      native: nativeFor(language),
      dir: directionFor(language),
      t: (key, vars) => translate(language, key, vars),
    };
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = value.locale;
    root.dir = value.dir;
  }, [value.locale, value.dir]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT(): LanguageContextValue {
  return useContext(LanguageContext);
}
