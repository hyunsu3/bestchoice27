"use client";

import { useSyncExternalStore } from "react";
import type { NewUniversityCard, UniversityCard } from "./types";

const STORAGE_KEY = "bestchoice.cards.v1";

type Listener = () => void;

let cards: UniversityCard[] = [];
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cards = raw ? (JSON.parse(raw) as UniversityCard[]) : [];
  } catch {
    cards = [];
  }
  hydrated = true;
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCardsSnapshot() {
  ensureHydrated();
  return cards;
}

function getCardsServerSnapshot() {
  return cards;
}

function getHydratedSnapshot() {
  return hydrated;
}

function addCard(card: NewUniversityCard) {
  cards = [
    ...cards,
    { ...card, id: crypto.randomUUID(), createdAt: Date.now() },
  ];
  persist();
  emit();
}

function removeCard(id: string) {
  cards = cards.filter((c) => c.id !== id);
  persist();
  emit();
}

function updateCard(id: string, patch: NewUniversityCard) {
  cards = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
  persist();
  emit();
}

export function useCards() {
  const cardList = useSyncExternalStore(
    subscribe,
    getCardsSnapshot,
    getCardsServerSnapshot,
  );
  const isHydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    () => false,
  );

  return {
    cards: cardList,
    hydrated: isHydrated,
    addCard,
    removeCard,
    updateCard,
  };
}
