"use client";

import { useMemo, useState } from "react";
import type { UniversityCard } from "@/lib/types";
import FlipCard from "./FlipCard";
import ResultCardModal from "./ResultCardModal";

type SortMode = "name" | "admissionType" | "capacity";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "name", label: "가나다" },
  { id: "admissionType", label: "전형별" },
  { id: "capacity", label: "모집인원" },
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
  }
}

export default function CardList({
  cards,
  onEdit,
  onDuplicate,
  onDelete,
  onCyclePickTier,
  onToggleMarked,
  onToggleApplied,
  onSetHeld,
}: {
  cards: UniversityCard[];
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onCyclePickTier: (id: string) => void;
  onToggleMarked: (id: string) => void;
  onToggleApplied: (id: string) => void;
  onSetHeld: (id: string, held: boolean) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [sortDesc, setSortDesc] = useState(false);
  // "선택"(핀 표시) 우선순위 토글: 어떤 기본 정렬을 쓰든, 켜져 있으면 그
  // 정렬 순서 안에서 핀 꽂힌 카드만 맨 앞으로 끌어온다.
  const [prioritizeMarked, setPrioritizeMarked] = useState(true);
  // "수능최저" 우선순위 토글: 켜져 있으면 수능최저가 있는 카드를 앞으로
  // 끌어온다. 기본은 꺼짐.
  const [prioritizeMinRequirement, setPrioritizeMinRequirement] = useState(false);
  // "+보류카드" 토글: 켜져 있으면 보류 카드도 다른 카드와 동일하게 정렬에 포함시킨다.
  // 기본은 꺼짐(보류 카드는 항상 맨 뒤).
  const [includeHeld, setIncludeHeld] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingCard = cards.find((c) => c.id === viewingId) ?? null;

  function openCard(card: UniversityCard) {
    setViewingId(card.id);
    fetch(`/api/cards/${card.id}/view`, { method: "POST" }).catch(() => {});
  }

  function handleSortClick(mode: SortMode) {
    if (mode === sortMode) {
      setSortDesc((d) => !d);
    } else {
      setSortMode(mode);
      setSortDesc(false);
    }
  }

  const sortedCards = useMemo(() => {
    const base = [...cards].sort((a, b) => compareCards(a, b, sortMode, sortDesc));
    const hasMinRequirement = (c: UniversityCard) =>
      !!c.minRequirement && c.minRequirement.trim() !== "없음";
    const priorityScore = (c: UniversityCard) =>
      (prioritizeMarked && c.marked ? 2 : 0) +
      (prioritizeMinRequirement && hasMinRequirement(c) ? 1 : 0);
    const applyPriority = (list: UniversityCard[]) =>
      prioritizeMarked || prioritizeMinRequirement
        ? [...list].sort((a, b) => priorityScore(b) - priorityScore(a))
        : list;
    // "+보류카드"가 켜져 있으면 보류 카드도 다른 카드와 동일하게 정렬/우선순위에 포함.
    if (includeHeld) {
      return applyPriority(base);
    }
    // 기본: 보류 카드는 정렬/우선순위와 무관하게 항상 맨 뒤로.
    const active = base.filter((c) => !c.held);
    const held = base.filter((c) => c.held);
    return [...applyPriority(active), ...held];
  }, [cards, sortMode, sortDesc, prioritizeMarked, prioritizeMinRequirement, includeHeld]);

  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
        아직 등록된 수시 카드가 없어요. 위에서 카드를 등록해보세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
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
        <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
        <button
          onClick={() =>
            setPrioritizeMarked((v) => {
              const next = !v;
              if (next) setIncludeHeld(false);
              return next;
            })
          }
          aria-pressed={prioritizeMarked}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-3.5 text-xs font-semibold transition-colors ${
            prioritizeMarked
              ? "bg-yellow-400 text-black"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
        >
          <span aria-hidden className="text-base leading-none">📌</span> 선택 우선
        </button>
        <button
          onClick={() => setPrioritizeMinRequirement((v) => !v)}
          aria-pressed={prioritizeMinRequirement}
          className={`inline-flex h-7 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
            prioritizeMinRequirement
              ? "bg-blue-500 text-white"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
        >
          수능최저
        </button>
        <button
          onClick={() =>
            setIncludeHeld((v) => {
              const next = !v;
              if (next) setPrioritizeMarked(false);
              return next;
            })
          }
          aria-pressed={includeHeld}
          className={`inline-flex h-7 items-center rounded-full px-3.5 text-xs font-semibold transition-colors ${
            includeHeld
              ? "bg-emerald-500 text-white"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
        >
          보류카드 포함
        </button>
      </div>
      <div className="grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
        {sortedCards.map((card) => (
          <FlipCard
            key={card.id}
            card={card}
            onOpen={() => openCard(card)}
            onCyclePickTier={() => onCyclePickTier(card.id)}
            onToggleMarked={() => onToggleMarked(card.id)}
            onToggleApplied={() => onToggleApplied(card.id)}
          />
        ))}
      </div>
      {viewingCard && (
        <ResultCardModal
          card={viewingCard}
          onClose={() => setViewingId(null)}
          onEdit={() => onEdit(viewingCard.id)}
          onDuplicate={() => onDuplicate(viewingCard.id)}
          onDelete={() => onDelete(viewingCard.id)}
          onSetHeld={(held) => onSetHeld(viewingCard.id, held)}
          initialFlipped
        />
      )}
    </div>
  );
}
