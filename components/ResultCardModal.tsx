"use client";

import { useEffect, useRef, useState } from "react";
import { getAutoHex } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import { PICK_TIER_COLORS } from "@/lib/pickTier";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

export default function ResultCardModal({
  card,
  onClose,
  onEdit,
  onDelete,
  initialFlipped = false,
}: {
  card: UniversityCard;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  initialFlipped?: boolean;
}) {
  const [flipped, setFlipped] = useState(initialFlipped);
  const { colors, ready: colorsReady } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];
  const scrollAreaRef = useRef<HTMLDListElement>(null);

  useEffect(() => {
    function insideScrollArea(target: EventTarget | null) {
      return target instanceof Node && !!scrollAreaRef.current?.contains(target);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    // 뒷면 요약 내용을 스크롤하는 경우는 제외하고, 그 밖의 스크롤(휠을
    // 아래로 굴리거나 화면을 위로 쓸어넘기는 것)은 팝업을 닫는 제스처로 본다.
    function onWheel(e: WheelEvent) {
      if (e.deltaY > 0 && !insideScrollArea(e.target)) onClose();
    }
    let touchStartY = 0;
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(e: TouchEvent) {
      if (insideScrollArea(e.target)) return;
      const currentY = e.touches[0]?.clientY ?? touchStartY;
      if (touchStartY - currentY > 10) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 text-3xl leading-none text-white/80 hover:text-white"
      >
        ×
      </button>
      <div
        className="flip-card h-[32rem] w-80 sm:h-[36rem] sm:w-96 lg:h-[42rem] lg:w-[28rem]"
        onClick={(e) => {
          e.stopPropagation();
          setFlipped((f) => !f);
        }}
      >
        <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
          <div
            className={`flip-card-face flip-card-front cursor-pointer text-white ${
              !colorsReady ? "animate-pulse bg-zinc-300 dark:bg-zinc-700" : ""
            }`}
            style={
              colorsReady
                ? {
                    backgroundColor: customColor || getAutoHex(card.universityName),
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 2px, transparent 2px, transparent 12px)",
                  }
                : undefined
            }
          >
            {card.pickTier !== "none" && (
              <span
                aria-hidden
                className="absolute right-3 top-3 h-4 w-4 rounded-full"
                style={{ backgroundColor: PICK_TIER_COLORS[card.pickTier] }}
              />
            )}
            {colorsReady && <CardFrontFace card={card} size="lg" />}
            <p className="mt-3 text-xs text-white/60">탭해서 뒤집어보기 ↺</p>
          </div>
          <div className="flip-card-face flip-card-back cursor-pointer bg-white dark:bg-zinc-900">
            {(onEdit || onDelete) && (
              <div className="absolute right-3 top-3 z-10 flex gap-1">
                {onEdit && (
                  <button
                    type="button"
                    aria-label="카드 수정"
                    title="카드 수정"
                    className="rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm hover:bg-white hover:text-indigo-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-indigo-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    aria-label="카드 삭제"
                    title="카드 삭제"
                    className="rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm hover:bg-white hover:text-rose-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-rose-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("이 카드를 삭제할까요?")) {
                        onDelete();
                        onClose();
                      }
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
            <div className="mt-8 border-b border-black/10 pb-3 dark:border-white/10">
              <p className="text-base font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
                {card.admissionType || "전형 미입력"}
              </p>
              <h3 className="mt-1 text-2xl font-black leading-tight text-black dark:text-white">
                {card.universityName}
              </h3>
              <p className="mt-1 text-lg font-semibold text-black/80 dark:text-white/80">
                {card.department}
                {card.capacity && ` · ${card.capacity}`}
              </p>
              {card.minRequirement && (
                <p className="mt-1 text-base font-medium text-black/60 dark:text-white/60">
                  수능최저 {card.minRequirement}
                </p>
              )}
            </div>
            <dl
              ref={scrollAreaRef}
              className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-lg"
              style={{ touchAction: "pan-y" }}
            >
              <div>
                <dt className="font-semibold text-black/60 dark:text-white/60">
                  전형요약
                </dt>
                <dd className="whitespace-pre-wrap">
                  {card.admissionSummary ? renderWithBold(card.admissionSummary) : "-"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-black/60 dark:text-white/60">
                  24-26년 입결 요약
                </dt>
                <dd className="whitespace-pre-wrap">
                  {card.resultSummary ? renderWithBold(card.resultSummary) : "-"}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-black/40 dark:text-white/40">
              탭해서 앞면으로
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
