"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bestchoice.universityColors.v1";

type ColorMap = Record<string, string>;
type Listener = () => void;

let colors: ColorMap = {};
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    colors = raw ? (JSON.parse(raw) as ColorMap) : {};
  } catch {
    colors = {};
  }
  hydrated = true;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getColorsSnapshot() {
  ensureHydrated();
  return colors;
}

function getColorsServerSnapshot() {
  return colors;
}

function setUniversityColor(universityName: string, color: string | null) {
  const key = universityName.trim();
  if (!key) return;
  const next = { ...colors };
  if (color) {
    next[key] = color;
  } else {
    delete next[key];
  }
  colors = next;
  persist();
  emit();
}

export function useUniversityColors() {
  const colorMap = useSyncExternalStore(
    subscribe,
    getColorsSnapshot,
    getColorsServerSnapshot,
  );
  return { colors: colorMap, setUniversityColor };
}
