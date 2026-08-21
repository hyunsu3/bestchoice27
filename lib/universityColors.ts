"use client";

import { useSyncExternalStore } from "react";
import { authorizedFetch } from "./authorizedFetch";

type ColorMap = Record<string, string>;
type Listener = () => void;

let colors: ColorMap = {};
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function ensureHydrated() {
  if (hydrated || hydrating || typeof window === "undefined") return;
  hydrating = fetch("/api/university-colors", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<ColorMap>) : {}))
    .then((data) => {
      colors = data;
    })
    .catch(() => {})
    .finally(() => {
      hydrated = true;
      hydrating = null;
      emit();
    });
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  ensureHydrated();
  return () => listeners.delete(listener);
}

function getColorsSnapshot() {
  return colors;
}

function getColorsServerSnapshot() {
  return colors;
}

async function setUniversityColor(universityName: string, color: string | null) {
  const key = universityName.trim();
  if (!key) return;
  const prev = colors;
  const next = { ...colors };
  if (color) {
    next[key] = color;
  } else {
    delete next[key];
  }
  colors = next;
  emit();

  try {
    const res = color
      ? await authorizedFetch("/api/university-colors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ universityName: key, color }),
        })
      : await authorizedFetch(
          `/api/university-colors/${encodeURIComponent(key)}`,
          { method: "DELETE" },
        );
    if (!res.ok) throw new Error("색상을 저장하지 못했습니다.");
  } catch (err) {
    colors = prev;
    emit();
    window.alert(
      err instanceof Error ? err.message : "색상 변경에 실패했습니다.",
    );
  }
}

export function useUniversityColors() {
  const colorMap = useSyncExternalStore(
    subscribe,
    getColorsSnapshot,
    getColorsServerSnapshot,
  );
  return { colors: colorMap, setUniversityColor };
}
