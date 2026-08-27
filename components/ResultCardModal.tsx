"use client";

import { useEffect, useState } from "react";
import { getAutoHex } from "@/lib/cardColor";
import { renderWithBold, renderWithSmall } from "@/lib/formatText";
import { PICK_TIER_COLORS, PICK_TIER_ICONS } from "@/lib/pickTier";
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

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    const scrollY = window.scrollY;
    const { body, documentElement: html } = document;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2"
      onClick={onClose}
    >
      <div className="absolute inset-0 touch-none bg-black/60" />
      <div
        className="flip-card relative"
        style={{
          aspectRatio: flipped ? "3 / 6.5" : "3 / 5",
          width: "min(96vw, calc(92dvh * 3 / 5), 28rem)",
          maxHeight: "92dvh",
          transition: "aspect-ratio 0.35s cubic-bezier(0.4, 0.2, 0.2, 1)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setFlipped((f) => !f);
        }}
      >
        <button
          type="button"
          aria-label="닫기"
          title="닫기"
          className="absolute right-1 top-4 z-10 flex h-16 w-16 items-center justify-center text-7xl leading-none text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ×
        </button>
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
            <div className="mt-10 ml-1 flex flex-1 flex-col">
              {colorsReady && <CardFrontFace card={card} size="lg" />}
            </div>
          </div>
          <div className="flip-card-face flip-card-back cursor-pointer bg-white dark:bg-zinc-900">
            <div
              className="mt-10 min-h-0 flex-1 overflow-y-auto pr-3"
              style={{
                touchAction: "pan-y",
                scrollbarGutter: "stable",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="border-b border-black/10 pb-3 pr-16 dark:border-white/10">
                <p className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 sm:text-base">
                  {card.admissionType || "전형 미입력"}
                </p>
                <h3 className="mt-1 flex items-center gap-1.5 text-xl font-black leading-tight text-black dark:text-white sm:text-2xl">
                  {renderWithSmall(card.universityName)}
                  {card.pickTier === "reach" && (
                    <span aria-hidden className="text-lg sm:text-xl">
                      {PICK_TIER_ICONS.reach}
                    </span>
                  )}
                  {(card.pickTier === "safe" || card.pickTier === "target") && (
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full sm:h-3.5 sm:w-3.5"
                      style={{ backgroundColor: PICK_TIER_COLORS[card.pickTier] }}
                    />
                  )}
                </h3>
                <p className="mt-1 text-base font-semibold text-black/80 dark:text-white/80 sm:text-lg">
                  {card.department}
                  {card.capacity && ` · ${card.capacity}`}
                </p>
                {card.minRequirement && (
                  <p className="mt-1 text-lg font-medium text-black/60 dark:text-white/60 sm:text-xl">
                    수능최저 {card.minRequirement}
                  </p>
                )}
              </div>
              <dl className="mt-3 flex flex-col gap-3 pb-6 text-base sm:text-lg">
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
                {(onEdit || onDelete) && (
                  <div className="flex justify-start gap-1 pt-1">
                    {onEdit && (
                      <button
                        type="button"
                        aria-label="카드 수정"
                        title="카드 수정"
                        className="rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm hover:bg-white hover:text-indigo-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-indigo-400 sm:text-sm"
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
                        className="rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm hover:bg-white hover:text-rose-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-rose-400 sm:text-sm"
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
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
