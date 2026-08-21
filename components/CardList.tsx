"use client";

import { useMemo, useState } from "react";
import type { UniversityCard } from "@/lib/types";
import FlipCard from "./FlipCard";

type SortMode = "latest" | "name" | "admissionType" | "capacity";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "latest", label: "최신순" },
  { id: "name", label: "가나다순" },
  { id: "admissionType", label: "전형별" },
  { id: "capacity", label: "모집인원순" },
];

function parseCapacity(capacity: string): number {
  const match = capacity.match(/\d+/);
  return match ? Number(match[0]) : Infinity;
}

function compareCards(
  a: UniversityCard,
  b: UniversityCard,
  mode: SortMode,
  desc: boolean,
): number {
  const dir = desc ? -1 : 1;
  switch (mode) {
    case "name":
      return dir * a.universityName.localeCompare(b.universityName, "ko");
    case "admissionType":
      return (
        dir * a.admissionType.localeCompare(b.admissionType, "ko") ||
        dir * a.universityName.localeCompare(b.universityName, "ko")
      );
    case "capacity": {
      const ca = parseCapacity(a.capacity);
      const cb = parseCapacity(b.capacity);
      // 인원 미입력 카드는 방향과 무관하게 항상 맨 뒤로.
      if (ca === Infinity && cb === Infinity) return 0;
      if (ca === Infinity) return 1;
      if (cb === Infinity) return -1;
      return dir * (cb - ca); // 기본(▼): 큰 인원부터
    }
    case "latest":
    default:
      return dir * (b.createdAt - a.createdAt);
  }
}

export default function CardList({
  cards,
  onEdit,
  onDelete,
}: {
  cards: UniversityCard[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [sortDesc, setSortDesc] = useState(false);

  function handleSortClick(mode: SortMode) {
    if (mode === sortMode) {
      setSortDesc((d) => !d);
    } else {
      setSortMode(mode);
      setSortDesc(false);
    }
  }

  const sortedCards = useMemo(
    () => [...cards].sort((a, b) => compareCards(a, b, sortMode, sortDesc)),
    [cards, sortMode, sortDesc],
  );

  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
        아직 등록된 수시 카드가 없어요. 위에서 카드를 등록해보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSortClick(opt.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              sortMode === opt.id
                ? "bg-indigo-600 text-white"
                : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
            }`}
          >
            {opt.label}
            {sortMode === opt.id && (
              <span className="ml-1">{sortDesc ? "▲" : "▼"}</span>
            )}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sortedCards.map((card) => (
          <FlipCard
            key={card.id}
            card={card}
            onEdit={() => onEdit(card.id)}
            onDelete={() => onDelete(card.id)}
          />
        ))}
      </div>
    </div>
  );
}
