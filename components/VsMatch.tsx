"use client";

import { useEffect, useState } from "react";
import type { UniversityCard } from "@/lib/types";
import { FINAL_COUNT, buildRoundQueue, type MatchQueueItem } from "@/lib/tournament";
import BattleCard from "./BattleCard";

type Phase = "idle" | "playing" | "done";

export default function VsMatch({ cards }: { cards: UniversityCard[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [queue, setQueue] = useState<MatchQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [winners, setWinners] = useState<UniversityCard[]>([]);
  const [results, setResults] = useState<UniversityCard[]>([]);
  const [matchKey, setMatchKey] = useState(0);
  const [leftOrigin, setLeftOrigin] = useState<"left" | "right">("left");
  const [candidateSide, setCandidateSide] = useState<"left" | "right" | null>(null);

  const canStart = cards.length > FINAL_COUNT;
  const currentItem = queue[queueIndex];

  function nextMatch() {
    setMatchKey((k) => k + 1);
    setLeftOrigin(Math.random() < 0.5 ? "left" : "right");
    setCandidateSide(null);
  }

  function start() {
    const q = buildRoundQueue(cards);
    setQueue(q);
    setQueueIndex(0);
    setWinners([]);
    setResults([]);
    setRound(1);
    setPhase("playing");
    nextMatch();
  }

  function completeMatch(winner: UniversityCard) {
    const newWinners = [...winners, winner];
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
    const timer = setTimeout(() => completeMatch(currentItem.card), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentItem]);

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
        <button className="btn-primary" onClick={start}>
          VS 시작
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6">
        <h2 className="text-2xl font-bold">🏆 최종 {results.length}장</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((card) => (
            <div
              key={card.id}
              className="rounded-2xl border border-amber-400/60 bg-amber-50 p-5 shadow-sm dark:bg-amber-500/10"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
                {card.admissionType || "전형 미입력"}
              </p>
              <h3 className="mt-2 text-lg font-bold">{card.universityName}</h3>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">
                {card.department}
              </p>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={start}>
          다시 시작
        </button>
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
            className="flex w-full max-w-3xl items-center justify-center gap-6 overflow-hidden"
          >
            <BattleCard
              card={currentItem.left}
              origin={leftOrigin}
              selected={candidateSide === "left"}
              dimmed={candidateSide === "right"}
              onHoldSelect={() => setCandidateSide("left")}
            />
            <span className="text-2xl font-black text-black/30 dark:text-white/30">
              VS
            </span>
            <BattleCard
              card={currentItem.right}
              origin={leftOrigin === "left" ? "right" : "left"}
              selected={candidateSide === "right"}
              dimmed={candidateSide === "left"}
              onHoldSelect={() => setCandidateSide("right")}
            />
          </div>
          <p className="text-xs text-black/40 dark:text-white/40">
            탭하면 카드가 뒤집혀요 · 길게 누르면 선택돼요
          </p>
          {candidateSide && (
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
              <p className="text-sm text-black/70 dark:text-white/70">
                {(candidateSide === "left" ? currentItem.left : currentItem.right)
                  .universityName}{" "}
                선택하시겠어요?
              </p>
              <button
                className="btn-primary px-4 py-1.5 text-sm"
                onClick={() =>
                  completeMatch(
                    candidateSide === "left" ? currentItem.left : currentItem.right,
                  )
                }
              >
                제출하기
              </button>
              <button
                className="text-sm font-medium text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                onClick={() => setCandidateSide(null)}
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
