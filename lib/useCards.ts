"use client";

import { useCallback, useEffect, useState } from "react";
import { requestPassword } from "./passwordPrompt";
import type { NewUniversityCard, UniversityCard } from "./types";

const LEGACY_STORAGE_KEY = "bestchoice.cards.v1";
const MIGRATED_KEY = "bestchoice.cards.migrated.v1";
const PASSWORD_KEY = "bestchoice.editPassword";

function getStoredPassword(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PASSWORD_KEY);
}

async function promptForPassword(): Promise<string | null> {
  const pw = await requestPassword();
  if (pw) window.sessionStorage.setItem(PASSWORD_KEY, pw);
  return pw;
}

async function authorizedFetch(url: string, init: RequestInit = {}) {
  let pw = getStoredPassword() ?? (await promptForPassword());
  if (!pw) throw new Error("비밀번호를 입력해야 합니다.");

  const withAuth = (password: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers ?? {}), "x-app-password": password },
  });

  let res = await fetch(url, withAuth(pw));
  if (res.status === 401) {
    window.sessionStorage.removeItem(PASSWORD_KEY);
    pw = await promptForPassword();
    if (!pw) throw new Error("비밀번호를 입력해야 합니다.");
    res = await fetch(url, withAuth(pw));
  }
  return res;
}

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

  return { cards, hydrated, addCard, removeCard, updateCard, refresh };
}
