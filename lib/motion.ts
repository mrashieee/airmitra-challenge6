"use client";

import { useSyncExternalStore } from "react";

export type MotionPreference = "auto" | "on" | "off";

const KEY = "airmitra.motion.v1";
const EVENT = "airmitra-motion";

export function getMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return "auto";
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "on" || value === "off" ? value : "auto";
  } catch {
    return "auto";
  }
}

export function applyMotionPreference(preference: MotionPreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("motion-on", preference === "on");
  root.classList.toggle("motion-off", preference === "off");
}

export function setMotionPreference(preference: MotionPreference): void {
  try {
    window.localStorage.setItem(KEY, preference);
  } catch {
    // storage blocked — still apply for this session
  }
  applyMotionPreference(preference);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeMotion(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useMotionPreference(): MotionPreference {
  return useSyncExternalStore(
    subscribeMotion,
    () => getMotionPreference(),
    () => "auto" as MotionPreference,
  );
}

export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", callback);
      return () => query.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
