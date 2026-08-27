"use client";

import { useEffect, useState } from "react";
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
          width: "min(96vw, calc(97vh * 3 / 5), 28rem)",
          maxHeight: "97vh",
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
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200/90 text-lg leading-none text-black/60 shadow-sm hover:bg-zinc-300 dark:bg-zinc-700/90 dark:text-white/60 dark:hover:bg-zinc-600"
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
            <div className="mt-8 ml-1 flex flex-1 flex-col">
              {colorsReady && <CardFrontFace card={card} size="lg" />}
              <p className="mt-3 text-xs text-white/60">탭해서 뒤집어보기 ↺</p>
            </div>
          </div>
          <div className="flip-card-face flip-card-back cursor-pointer bg-white dark:bg-zinc-900">
            <div
              className="mt-8 min-h-0 flex-1 overflow-y-auto"
              style={{ touchAction: "pan-y" }}
            >
              <div
                className="sticky top-0 border-b border-black/10 bg-white pb-3 pl-3 dark:border-white/10 dark:bg-zinc-900"
                style={{
                  borderLeft: `4px solid ${
                    card.pickTier !== "none" ? PICK_TIER_COLORS[card.pickTier] : "transparent"
                  }`,
                }}
              >
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
              <dl className="mt-3 flex flex-col gap-3 text-lg">
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
                  <div className="flex justify-end gap-1 pt-1">
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
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
