"use client";

import { useMemo, useState } from "react";
import { PICK_TIER_ORDER } from "@/lib/pickTier";
import type { UniversityCard } from "@/lib/types";
import FlipCard from "./FlipCard";
import ResultCardModal from "./ResultCardModal";

type SortMode = "latest" | "name" | "admissionType" | "capacity" | "pickTier";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "latest", label: "최신" },
  { id: "name", label: "가나다" },
  { id: "admissionType", label: "전형별" },
  { id: "capacity", label: "모집인원" },
  { id: "pickTier", label: "선택" },
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
    case "pickTier": {
      // 기본(▼): 안정(1) → 적정(2) → 상향(3) → 해제 순. 같은 등급 안에서는
      // 좌우 화살표로 옮긴 우선순위(pickRank)가 큰 카드부터(앞으로 보낼수록
      // 앞에 오도록) 보여주고, 값이 같으면 이름순으로 대체한다.
      const rank = (t: UniversityCard["pickTier"]) =>
        t === "none" ? PICK_TIER_ORDER.length : PICK_TIER_ORDER.indexOf(t);
      return (
        dir * (rank(a.pickTier) - rank(b.pickTier)) ||
        dir * (b.pickRank - a.pickRank) ||
        dir * a.universityName.localeCompare(b.universityName, "ko")
      );
    }
    case "latest":
    default:
      return dir * (b.createdAt - a.createdAt);
  }
}

// 최신순 정렬 시, 같은 학교 카드들이 흩어지지 않도록 학교별 최신 등록 시점
// 기준으로 먼저 묶고 그 안에서 다시 최신순으로 정렬한다.
function buildLatestGroupRanks(cards: UniversityCard[]): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const c of cards) {
    const key = c.universityName.trim();
    const prev = ranks.get(key);
    if (prev === undefined || c.createdAt > prev) ranks.set(key, c.createdAt);
  }
  return ranks;
}

function sortLatestGrouped(
  cards: UniversityCard[],
  desc: boolean,
): UniversityCard[] {
  const ranks = buildLatestGroupRanks(cards);
  const dir = desc ? -1 : 1;
  return [...cards].sort((a, b) => {
    const ra = ranks.get(a.universityName.trim()) ?? a.createdAt;
    const rb = ranks.get(b.universityName.trim()) ?? b.createdAt;
    return dir * (rb - ra) || dir * (b.createdAt - a.createdAt);
  });
}

export default function CardList({
  cards,
  onEdit,
  onDelete,
  onCyclePickTier,
  onMovePickRank,
}: {
  cards: UniversityCard[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCyclePickTier: (id: string) => void;
  onMovePickRank: (id: string, delta: 1 | -1) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("pickTier");
  const [sortDesc, setSortDesc] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingCard = cards.find((c) => c.id === viewingId) ?? null;

  function openCard(card: UniversityCard) {
    setViewingId(card.id);
    fetch(`/api/cards/${card.id}/view`, { method: "POST" }).catch(() => {});
  }

  function handleSortClick(mode: SortMode) {
    // 선택등급순은 항상 안정→적정→상향→해제 고정 순서만 보여준다. 선택/비선택
    // 순서를 뒤집는 토글은 제공하지 않는다.
    if (mode === "pickTier") {
      setSortMode("pickTier");
      setSortDesc(false);
      return;
    }
    if (mode === sortMode) {
      setSortDesc((d) => !d);
    } else {
      setSortMode(mode);
      setSortDesc(false);
    }
  }

  const sortedCards = useMemo(() => {
    if (sortMode === "latest") return sortLatestGrouped(cards, sortDesc);
    return [...cards].sort((a, b) => compareCards(a, b, sortMode, sortDesc));
  }, [cards, sortMode, sortDesc]);

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
      <div className="grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-4">
        {sortedCards.map((card, i) => {
          const prevCard = sortedCards[i - 1];
          const nextCard = sortedCards[i + 1];
          const canMoveLeft =
            sortMode === "pickTier" && prevCard?.pickTier === card.pickTier;
          const canMoveRight =
            sortMode === "pickTier" && nextCard?.pickTier === card.pickTier;
          return (
            <FlipCard
              key={card.id}
              card={card}
              onOpen={() => openCard(card)}
              onCyclePickTier={() => onCyclePickTier(card.id)}
              onMoveLeft={
                canMoveLeft ? () => onMovePickRank(card.id, 1) : undefined
              }
              onMoveRight={
                canMoveRight ? () => onMovePickRank(card.id, -1) : undefined
              }
            />
          );
        })}
      </div>
      {viewingCard && (
        <ResultCardModal
          card={viewingCard}
          onClose={() => setViewingId(null)}
          onEdit={() => onEdit(viewingCard.id)}
          onDelete={() => onDelete(viewingCard.id)}
          initialFlipped
        />
      )}
    </div>
  );
}
