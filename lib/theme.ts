"use client";

import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

const KEY = "airmitra.theme.v1";
const EVENT = "airmitra-theme";

function systemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function resolveDark(preference: ThemePreference): boolean {
  return preference === "dark" || (preference === "system" && systemDark());
}

export function applyTheme(preference: ThemePreference): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(preference));
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(KEY, preference);
  } catch {
    // storage blocked — still apply for this session
  }
  applyTheme(preference);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeTheme(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const mediaHandler = () => {
    if (getThemePreference() === "system") applyTheme("system");
    callback();
  };
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  media.addEventListener("change", mediaHandler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
    media.removeEventListener("change", mediaHandler);
  };
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    subscribeTheme,
    () => getThemePreference(),
    () => "system" as ThemePreference,
  );
}
