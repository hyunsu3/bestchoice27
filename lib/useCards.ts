"use client";

import { useCallback, useEffect, useState } from "react";
import { authorizedFetch } from "./authorizedFetch";
import { nextPickTier } from "./pickTier";
import type { NewUniversityCard, PickTier, UniversityCard } from "./types";

const LEGACY_STORAGE_KEY = "bestchoice.cards.v1";
const MIGRATED_KEY = "bestchoice.cards.migrated.v1";

async function migrateLegacyCards() {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY)) return;

  const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(MIGRATED_KEY, "true");
    return;
  }

  try {
    const legacyCards = JSON.parse(raw) as UniversityCard[];
    if (legacyCards.length > 0) {
      const payload: NewUniversityCard[] = legacyCards.map((c) => ({
        universityName: c.universityName,
        department: c.department,
        admissionType: c.admissionType,
        capacity: c.capacity,
        minRequirement: c.minRequirement ?? "",
        admissionSummary: c.admissionSummary,
        resultSummary: c.resultSummary,
      }));
      const res = await fetch("/api/cards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return; // retry on next load
    }
    window.localStorage.setItem(MIGRATED_KEY, "true");
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Malformed legacy data or network error: leave it and retry next load.
  }
}

export function useCards() {
  const [cards, setCards] = useState<UniversityCard[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/cards", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as UniversityCard[];
    setCards(data);
  }, []);

  useEffect(() => {
    (async () => {
      await migrateLegacyCards();
      await refresh();
      setHydrated(true);
    })();
  }, [refresh]);

  const addCard = useCallback(async (card: NewUniversityCard) => {
    const res = await authorizedFetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
    });
    if (!res.ok) throw new Error("카드를 등록하지 못했습니다.");
    const created = (await res.json()) as UniversityCard;
    setCards((prev) => [...prev, created]);
  }, []);

  const removeCard = useCallback(async (id: string) => {
    try {
      const res = await authorizedFetch(`/api/cards/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("카드를 삭제하지 못했습니다.");
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "카드를 삭제하지 못했습니다.",
      );
    }
  }, []);

  const updateCard = useCallback(
    async (id: string, patch: NewUniversityCard) => {
      const res = await authorizedFetch(`/api/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("카드를 수정하지 못했습니다.");
      const updated = (await res.json()) as UniversityCard;
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    },
    [],
  );

  const cyclePickTier = useCallback(async (id: string) => {
    let previous: PickTier | undefined;
    let next: PickTier | undefined;
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        previous = c.pickTier;
        next = nextPickTier(c.pickTier);
        return { ...c, pickTier: next };
      }),
    );
    if (previous === undefined || next === undefined) return;
    try {
      const res = await fetch(`/api/cards/${id}/pick-tier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickTier: next }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as UniversityCard;
      setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pickTier: previous! } : c)),
      );
    }
  }, []);

  return {
    cards,
    hydrated,
    addCard,
    removeCard,
    updateCard,
    cyclePickTier,
    refresh,
  };
}
