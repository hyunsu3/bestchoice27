"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UniversityCard } from "@/lib/types";
import FlipCard from "./FlipCard";
import ResultCardModal from "./ResultCardModal";

type SortMode = "name" | "admissionType";

const SORT_OPTIONS: { id: SortMode; label: string }[] = [
  { id: "name", label: "가나다" },
  { id: "admissionType", label: "전형별" },
];

// 정렬/필터 옵션을 브라우저에 저장해서 새로고침해도 유지되게 한다.
const SORT_PREFS_KEY = "cardList:sortPrefs:v1";

type SortPrefs = {
  sortMode: SortMode;
  sortDesc: boolean;
  prioritizeMarked: boolean;
  prioritizeMinRequirement: boolean;
  includeHeld: boolean;
  prioritizeApplied: boolean;
};

function loadSortPrefs(): Partial<SortPrefs> {
  try {
    const raw = window.localStorage.getItem(SORT_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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
      return (
        dir * a.universityName.localeCompare(b.universityName, "ko") ||
        dir * a.department.localeCompare(b.department, "ko") ||
        dir * a.admissionType.localeCompare(b.admissionType, "ko")
      );
    case "admissionType":
      return (
        dir * a.admissionType.localeCompare(b.admissionType, "ko") ||
        dir * a.universityName.localeCompare(b.universityName, "ko")
      );
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
  // "최종 선택" 토글: 켜져 있으면 지원완료 카드를 맨 앞으로 끌어온다.
  // 켜질 때 "1차 선택"은 자동으로 꺼진다. 기본은 꺼짐.
  const [prioritizeApplied, setPrioritizeApplied] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewingCard = cards.find((c) => c.id === viewingId) ?? null;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2400);
  }

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  // 저장된 정렬/필터 옵션을 처음 마운트될 때 한 번 불러온다.
  useEffect(() => {
    const prefs = loadSortPrefs();
    if (prefs.sortMode === "name" || prefs.sortMode === "admissionType")
      setSortMode(prefs.sortMode);
    if (typeof prefs.sortDesc === "boolean") setSortDesc(prefs.sortDesc);
    if (typeof prefs.prioritizeMarked === "boolean") setPrioritizeMarked(prefs.prioritizeMarked);
    if (typeof prefs.prioritizeMinRequirement === "boolean")
      setPrioritizeMinRequirement(prefs.prioritizeMinRequirement);
    if (typeof prefs.includeHeld === "boolean") setIncludeHeld(prefs.includeHeld);
    if (typeof prefs.prioritizeApplied === "boolean")
      setPrioritizeApplied(prefs.prioritizeApplied);
    setPrefsLoaded(true);
  }, []);

  // 옵션이 바뀔 때마다 저장한다. 불러오기 전에 저장하면 기본값으로 덮어써버리므로
  // prefsLoaded가 true가 된 이후부터만 저장한다.
  useEffect(() => {
    if (!prefsLoaded) return;
    try {
      window.localStorage.setItem(
        SORT_PREFS_KEY,
        JSON.stringify({
          sortMode,
          sortDesc,
          prioritizeMarked,
          prioritizeMinRequirement,
          includeHeld,
          prioritizeApplied,
        }),
      );
    } catch {
      // 저장 실패는 무시 (예: 시크릿 모드에서 storage 접근 제한)
    }
  }, [
    prefsLoaded,
    sortMode,
    sortDesc,
    prioritizeMarked,
    prioritizeMinRequirement,
    includeHeld,
    prioritizeApplied,
  ]);

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
      (prioritizeApplied && c.applied ? 2 : 0) +
      (prioritizeMinRequirement && hasMinRequirement(c) ? 1 : 0);
    const applyPriority = (list: UniversityCard[]) =>
      prioritizeMarked || prioritizeMinRequirement || prioritizeApplied
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
  }, [
    cards,
    sortMode,
    sortDesc,
    prioritizeMarked,
    prioritizeMinRequirement,
    includeHeld,
    prioritizeApplied,
  ]);

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
              if (next) {
                setIncludeHeld(false);
                setPrioritizeApplied(false);
              }
              return next;
            })
          }
          aria-pressed={prioritizeMarked}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-3.5 text-xs font-semibold transition-colors ${
            prioritizeMarked
              ? "bg-[#FEE500] text-black"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
        >
          <span aria-hidden className="text-base leading-none">📌</span> 1차 선택
        </button>
        <button
          onClick={() =>
            setPrioritizeApplied((v) => {
              const next = !v;
              if (next) {
                setPrioritizeMarked(false);
                if (!cards.some((c) => c.applied)) {
                  showToast("원서를 준비중입니다");
                }
              }
              return next;
            })
          }
          aria-pressed={prioritizeApplied}
          className={`inline-flex h-7 items-center gap-1 rounded-full px-3.5 text-xs font-semibold transition-colors ${
            prioritizeApplied
              ? "bg-green-600 text-white"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
        >
          <span aria-hidden className="text-lg font-bold leading-none">🍀</span> 최종 선택
        </button>
        <span className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />
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
              ? "bg-zinc-500 text-white"
              : "border border-black/10 text-black/60 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:text-white"
          }`}
          style={
            includeHeld
              ? {
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 2px, transparent 2px, transparent 7px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, transparent 2px, transparent 7px)",
                }
              : undefined
          }
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
          onEdit={() => {
            setViewingId(null);
            onEdit(viewingCard.id);
          }}
          onDuplicate={() => {
            setViewingId(null);
            onDuplicate(viewingCard.id);
          }}
          onDelete={() => onDelete(viewingCard.id)}
          onSetHeld={(held) => onSetHeld(viewingCard.id, held)}
          initialFlipped
        />
      )}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
        >
          <div className="toast-pop relative rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
            <span aria-hidden className="absolute -left-3 -top-3 -rotate-12 text-base">
              🍀
            </span>
            <span aria-hidden className="absolute -right-4 -top-2 rotate-12 text-sm">
              🍀
            </span>
            <span aria-hidden className="absolute -bottom-3 -left-4 rotate-6 text-sm">
              🍀
            </span>
            <span aria-hidden className="absolute -bottom-3 -right-3 -rotate-6 text-base">
              🍀
            </span>
            🍀 {toastMessage}
          </div>
        </div>
      )}
    </div>
  );
}
