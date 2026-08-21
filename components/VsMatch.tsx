"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { darkenHex, getCardGradient } from "@/lib/cardColor";
import type { UniversityCard } from "@/lib/types";
import { FINAL_COUNT, buildNextRoundQueue, type MatchQueueItem } from "@/lib/tournament";
import { useUniversityColors } from "@/lib/universityColors";
import BattleCard from "./BattleCard";
import CardFrontFace from "./CardFrontFace";
import ResultCardModal from "./ResultCardModal";

type Phase = "idle" | "select" | "playing" | "done";

const EXPORT_TIMEOUT_MS = 8000;

function buildResultFileName(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const base = `수시-이상형월드컵-결과-${y}-${m}-${d}`;

  if (typeof window === "undefined") return `${base}.png`;
  const key = `bestchoice.resultDownloadCount.${base}`;
  const count = Number(window.localStorage.getItem(key) ?? "0");
  window.localStorage.setItem(key, String(count + 1));
  return count === 0 ? `${base}.png` : `${base}_${count}.png`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("이미지 생성 시간이 초과됐어요.")), ms),
    ),
  ]);
}

export default function VsMatch({ cards }: { cards: UniversityCard[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState<MatchQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [winners, setWinners] = useState<UniversityCard[]>([]);
  const [roundLosers, setRoundLosers] = useState<UniversityCard[]>([]);
  const [rankedCards, setRankedCards] = useState<UniversityCard[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [ghostRect, setGhostRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dragPointerId = useRef<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const dragGrabOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [matchKey, setMatchKey] = useState(0);
  const [leftOrigin, setLeftOrigin] = useState<"left" | "right">("left");
  const [selectedSides, setSelectedSides] = useState<Set<"left" | "right">>(
    new Set(),
  );
  const [viewingCard, setViewingCard] = useState<UniversityCard | null>(null);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { colors } = useUniversityColors();

  const canStart = cards.length > FINAL_COUNT;
  const currentItem = queue[queueIndex];
  const activeCards = cards.filter((c) => !excludedIds.has(c.id));

  function nextMatch() {
    setMatchKey((k) => k + 1);
    setLeftOrigin(Math.random() < 0.5 ? "left" : "right");
    setSelectedSides(new Set());
  }

  function toggleSide(side: "left" | "right") {
    setSelectedSides((prev) => {
      const next = new Set(prev);
      if (next.has(side)) {
        next.delete(side);
      } else {
        next.add(side);
      }
      return next;
    });
  }

  function goToSelect() {
    setExcludedIds(new Set());
    setPhase("select");
  }

  function toggleExclude(id: string) {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function start() {
    const q = buildNextRoundQueue(activeCards, FINAL_COUNT);
    setQueue(q);
    setQueueIndex(0);
    setWinners([]);
    setRoundLosers([]);
    setRankedCards([]);
    setRound(1);
    setPhase("playing");
    nextMatch();
  }

  function completeMatch(matchWinners: UniversityCard[]) {
    const newWinners = [...winners, ...matchWinners];
    const winnerIds = new Set(matchWinners.map((c) => c.id));
    const matchLosers =
      currentItem?.type === "pair"
        ? [currentItem.left, currentItem.right].filter((c) => !winnerIds.has(c.id))
        : [];
    const newRoundLosers = [...roundLosers, ...matchLosers];

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setWinners(newWinners);
      setRoundLosers(newRoundLosers);
      setQueueIndex(nextIndex);
      nextMatch();
      return;
    }
    if (newWinners.length <= FINAL_COUNT) {
      const finalCandidates = newRoundLosers.slice(0, 3);
      setRankedCards([...newWinners, ...finalCandidates]);
      setPhase("done");
      return;
    }
    setQueue(buildNextRoundQueue(newWinners, FINAL_COUNT));
    setQueueIndex(0);
    setWinners([]);
    setRoundLosers([]);
    setRound((r) => r + 1);
    nextMatch();
  }

  useEffect(() => {
    if (phase !== "playing" || !currentItem || currentItem.type !== "bye") return;
    const timer = setTimeout(() => completeMatch([currentItem.card]), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentItem]);

  const DRAG_THRESHOLD_PX = 8;
  const FLIP_DURATION_MS = 220;

  function registerCardRef(id: string, el: HTMLElement | null) {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }

  // FLIP: whenever rankedCards reorders, the non-dragged siblings jump to
  // their new grid slot instantly. Undo that jump with a transform, then
  // animate it away so the shift reads as a smooth slide instead of a snap.
  useLayoutEffect(() => {
    const prevRects = prevRectsRef.current;
    if (prevRects.size === 0) return;
    for (const [id, el] of cardRefs.current) {
      if (id === draggingId) continue;
      const prev = prevRects.get(id);
      if (!prev) continue;
      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;
      if (dx || dy) {
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        void el.offsetWidth;
        el.style.transition = `transform ${FLIP_DURATION_MS}ms ease`;
        el.style.transform = "";
      }
    }
    prevRectsRef.current = new Map();
  }, [rankedCards, draggingId]);

  function handleCardPointerDown(e: React.PointerEvent, id: string) {
    const el = cardRefs.current.get(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragPointerId.current = e.pointerId;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragGrabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragMoved.current = false;
    setDraggingId(id);
    setGhostRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  }

  // Move/up listeners live on window instead of the dragged card's own
  // element: once a reorder moves that element to a new DOM position, a
  // per-element pointer capture can silently stop delivering events on some
  // browsers, which made the drag "freeze" mid-gesture. window never moves.
  useEffect(() => {
    if (!draggingId) return;
    const id = draggingId;

    function onMove(e: PointerEvent) {
      if (dragPointerId.current !== e.pointerId) return;
      const start = dragStartPos.current;
      if (start) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) dragMoved.current = true;
      }
      if (!dragMoved.current) return;
      e.preventDefault();

      setGhostRect((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX - dragGrabOffset.current.x,
              y: e.clientY - dragGrabOffset.current.y,
            }
          : prev,
      );

      let targetId: string | null = null;
      for (const [otherId, el] of cardRefs.current) {
        if (otherId === id) continue;
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          targetId = otherId;
          break;
        }
      }
      if (!targetId) return;

      const rects = new Map<string, DOMRect>();
      for (const [cid, el] of cardRefs.current) rects.set(cid, el.getBoundingClientRect());
      prevRectsRef.current = rects;

      setRankedCards((prev) => {
        const fromIndex = prev.findIndex((c) => c.id === id);
        const toIndex = prev.findIndex((c) => c.id === targetId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    }

    function onUp(e: PointerEvent) {
      if (dragPointerId.current !== e.pointerId) return;
      dragPointerId.current = null;
      setDraggingId(null);
      setGhostRect(null);
      if (!dragMoved.current) {
        const card = rankedCards.find((c) => c.id === id);
        if (card) setViewingCard(card);
      }
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // rankedCards is read only inside the tap-fallback branch, which only
    // runs when no reorder happened yet, so the value captured when the
    // drag started is still accurate — omitted to avoid re-subscribing on
    // every reorder mid-drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId]);

  function handleCardPointerUp(e: React.PointerEvent, card: UniversityCard) {
    if (dragPointerId.current !== e.pointerId) return;
    dragPointerId.current = null;
    setDraggingId(null);
    setGhostRect(null);
    if (!dragMoved.current) setViewingCard(card);
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = buildResultFileName();
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveImage() {
    if (!resultsRef.current || exporting) return;
    setExporting(true);
    try {
      const blob = await withTimeout(
        toBlob(resultsRef.current, { pixelRatio: 2 }),
        EXPORT_TIMEOUT_MS,
      );
      if (!blob) throw new Error("이미지 생성 실패");
      downloadBlob(blob);
    } catch (err) {
      console.error(err);
      alert("이미지 저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setExporting(false);
    }
  }

  if (!canStart && phase === "idle") {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
        VS 대결을 시작하려면 수시 카드가 {FINAL_COUNT}장보다 많아야 해요. (현재{" "}
        {cards.length}장)
      </p>
    );
  }

  if (phase === "idle") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-black/10 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
        <p className="text-black/70 dark:text-white/70">
          등록된 {cards.length}장의 수시 카드로 이상형 월드컵을 시작해요.
          <br />
          최종 {FINAL_COUNT}장이 남을 때까지 마음에 드는 카드를 골라주세요.
        </p>
        <button className="btn-primary" onClick={goToSelect}>
          VS 시작
        </button>
      </div>
    );
  }

  if (phase === "select") {
    const canProceed = activeCards.length > FINAL_COUNT;
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="text-lg font-bold">VS대결 전에 제외할 카드가 있나요?</h2>
          <p className="mt-1 text-sm text-black/50 dark:text-white/50">
            제외할 카드를 탭하면 대결에서 빠지고, 다시 탭하면 해제돼요 · 참여{" "}
            {activeCards.length}장 / 보류 {excludedIds.size}장 / 전체{" "}
            {cards.length}장
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => {
            const isOut = excludedIds.has(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleExclude(card.id)}
                className={`relative rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition dark:border-white/10 dark:bg-white/5 ${
                  isOut ? "opacity-40" : "hover:shadow-md"
                }`}
              >
                {isOut && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white/20">
                    보류
                  </span>
                )}
                <p className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
                  {card.admissionType || "전형 미입력"}
                </p>
                <h3 className="mt-1 text-sm font-bold">{card.universityName}</h3>
                <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
                  {card.department}
                </p>
                {card.capacity && (
                  <p className="mt-1 text-lg font-black">{card.capacity}</p>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            onClick={() => setPhase("idle")}
          >
            이전
          </button>
          <button
            className="btn-primary disabled:opacity-50"
            disabled={!canProceed}
            onClick={start}
          >
            VS 시작 ({activeCards.length}장)
          </button>
        </div>
        {!canProceed && (
          <p className="text-xs text-rose-500">
            최소 {FINAL_COUNT + 1}장이 참여해야 시작할 수 있어요.
          </p>
        )}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div
          ref={resultsRef}
          className="flex flex-col items-center gap-6 rounded-3xl bg-white p-8 dark:bg-zinc-900"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold">🏆 최종 {FINAL_COUNT}장</h2>
            <p className="mt-1 text-xs text-black/40 dark:text-white/40">
              카드를 눌러 끌면 순위를 바꿀 수 있어요 · 뒤 카드들은 자동으로 밀려요
            </p>
          </div>
          <div className="mx-auto grid w-full grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {rankedCards.map((card, index) => {
              const customColor = colors[card.universityName.trim()];
              const isFinal = index < FINAL_COUNT;
              const isDragging = draggingId === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  ref={(el) => registerCardRef(card.id, el)}
                  onPointerDown={(e) => handleCardPointerDown(e, card.id)}
                  style={{
                    touchAction: "none",
                    ...(customColor
                      ? {
                          backgroundImage: `linear-gradient(to bottom right, ${customColor}, ${darkenHex(customColor)})`,
                        }
                      : undefined),
                  }}
                  className={`relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl p-1.5 text-left text-white shadow-sm transition-shadow sm:p-3 ${
                    customColor ? "" : `bg-gradient-to-br ${getCardGradient(card.universityName)}`
                  } ${isDragging ? "opacity-0" : "hover:shadow-md"} ${
                    isFinal ? "" : "opacity-70"
                  }`}
                >
                  <span
                    className={`absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow sm:h-6 sm:w-6 sm:text-xs ${
                      isFinal ? "bg-amber-400 text-black" : "bg-black/50 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <CardFrontFace card={card} size="sm" />
                </button>
              );
            })}
          </div>
        </div>
        {draggingId &&
          ghostRect &&
          (() => {
            const dragIndex = rankedCards.findIndex((c) => c.id === draggingId);
            const card = rankedCards[dragIndex];
            if (!card) return null;
            const customColor = colors[card.universityName.trim()];
            const isFinal = dragIndex < FINAL_COUNT;
            return (
              <div
                className={`pointer-events-none fixed z-50 flex scale-105 flex-col overflow-hidden rounded-2xl p-1.5 text-left text-white shadow-2xl sm:p-3 ${
                  customColor ? "" : `bg-gradient-to-br ${getCardGradient(card.universityName)}`
                }`}
                style={{
                  left: ghostRect.x,
                  top: ghostRect.y,
                  width: ghostRect.width,
                  height: ghostRect.height,
                  ...(customColor
                    ? {
                        backgroundImage: `linear-gradient(to bottom right, ${customColor}, ${darkenHex(customColor)})`,
                      }
                    : undefined),
                }}
              >
                <span
                  className={`absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow sm:h-6 sm:w-6 sm:text-xs ${
                    isFinal ? "bg-amber-400 text-black" : "bg-black/50 text-white"
                  }`}
                >
                  {dragIndex + 1}
                </span>
                <CardFrontFace card={card} size="sm" />
              </div>
            );
          })()}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button className="btn-primary" onClick={goToSelect}>
            다시 시작
          </button>
          <button
            className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/70 transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            onClick={handleSaveImage}
            disabled={exporting}
          >
            이미지로 저장
          </button>
        </div>
        {viewingCard && (
          <ResultCardModal card={viewingCard} onClose={() => setViewingCard(null)} />
        )}
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-black/50 dark:text-white/50">
        {round}라운드 · 남은 매치 {queue.length - queueIndex}개 · 진행 승자{" "}
        {winners.length}장
      </p>
      {currentItem.type === "bye" ? (
        <div className="flex h-80 w-64 flex-col items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white p-5 text-center shadow-lg dark:border-white/10 dark:bg-zinc-900">
          <p className="text-sm text-black/50 dark:text-white/50">부전승</p>
          <h3 className="text-lg font-bold">{currentItem.card.universityName}</h3>
          <p className="text-sm text-black/70 dark:text-white/70">
            {currentItem.card.department}
          </p>
        </div>
      ) : (
        <>
          <div
            key={matchKey}
            className="flex w-full max-w-3xl items-center justify-center gap-6 overflow-x-hidden py-2"
          >
            <BattleCard
              card={currentItem.left}
              origin={leftOrigin}
              selected={selectedSides.has("left")}
              dimmed={selectedSides.has("right") && !selectedSides.has("left")}
              onHoldSelect={() => toggleSide("left")}
            />
            <span className="text-2xl font-black text-black/30 dark:text-white/30">
              VS
            </span>
            <BattleCard
              card={currentItem.right}
              origin={leftOrigin === "left" ? "right" : "left"}
              selected={selectedSides.has("right")}
              dimmed={selectedSides.has("left") && !selectedSides.has("right")}
              onHoldSelect={() => toggleSide("right")}
            />
          </div>
          <p className="text-xs text-black/40 dark:text-white/40">
            탭하면 카드가 뒤집혀요 · 길게 누르면 선택돼요 · 둘 다 마음에 들면 둘 다 눌러주세요
          </p>
          {selectedSides.size > 0 && (
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-black/70 dark:text-white/70">
                {selectedSides.size === 2
                  ? "두 카드 모두 선택하시겠어요?"
                  : `${
                      (selectedSides.has("left")
                        ? currentItem.left
                        : currentItem.right
                      ).universityName
                    } 선택하시겠어요?`}
              </p>
              <button
                className="btn-primary px-4 py-1.5 text-sm"
                onClick={() =>
                  completeMatch(
                    (["left", "right"] as const)
                      .filter((side) => selectedSides.has(side))
                      .map((side) =>
                        side === "left" ? currentItem.left : currentItem.right,
                      ),
                  )
                }
              >
                제출하기
              </button>
              <button
                className="text-sm font-medium text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                onClick={() => setSelectedSides(new Set())}
              >
                다시 고르기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
