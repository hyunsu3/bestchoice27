"use client";

import { useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import type { UniversityCard } from "@/lib/types";
import { FINAL_COUNT, buildRoundQueue, type MatchQueueItem } from "@/lib/tournament";
import BattleCard from "./BattleCard";
import ResultCardModal from "./ResultCardModal";

type Phase = "idle" | "select" | "playing" | "done";

const RESULT_FILE_NAME = "수시-이상형월드컵-결과.png";
const EXPORT_TIMEOUT_MS = 8000;

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
  const [results, setResults] = useState<UniversityCard[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [matchKey, setMatchKey] = useState(0);
  const [leftOrigin, setLeftOrigin] = useState<"left" | "right">("left");
  const [selectedSides, setSelectedSides] = useState<Set<"left" | "right">>(
    new Set(),
  );
  const [viewingCard, setViewingCard] = useState<UniversityCard | null>(null);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    const q = buildRoundQueue(activeCards);
    setQueue(q);
    setQueueIndex(0);
    setWinners([]);
    setResults([]);
    setRound(1);
    setPhase("playing");
    nextMatch();
  }

  function completeMatch(matchWinners: UniversityCard[]) {
    const newWinners = [...winners, ...matchWinners];
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setWinners(newWinners);
      setQueueIndex(nextIndex);
      nextMatch();
      return;
    }
    if (newWinners.length <= FINAL_COUNT) {
      setResults(newWinners);
      setPhase("done");
      return;
    }
    setQueue(buildRoundQueue(newWinners));
    setQueueIndex(0);
    setWinners([]);
    setRound((r) => r + 1);
    nextMatch();
  }

  useEffect(() => {
    if (phase !== "playing" || !currentItem || currentItem.type !== "bye") return;
    const timer = setTimeout(() => completeMatch([currentItem.card]), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentItem]);

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = RESULT_FILE_NAME;
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
          <h2 className="text-2xl font-bold">🏆 최종 {results.length}장</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setViewingCard(card)}
                className="rounded-2xl border border-amber-400/60 bg-amber-50 p-5 text-left shadow-sm transition hover:shadow-md dark:bg-amber-500/10"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                  {card.admissionType || "전형 미입력"}
                </p>
                <h3 className="mt-2 text-lg font-bold">{card.universityName}</h3>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                  {card.department}
                </p>
              </button>
            ))}
          </div>
        </div>
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
