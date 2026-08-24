"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { darkenHex, getCardGradient } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

const AUTO_FLIP_BACK_MS = 20000;
const LONG_PRESS_MS = 1000;
const LONG_PRESS_MOVE_TOLERANCE = 10;

export default function FlipCard({
  card,
  onEdit,
  onDelete,
  onToggleFavorite,
}: {
  card: UniversityCard;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const backScrollRef = useRef<HTMLDListElement>(null);
  const { colors } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef(false);

  function clearPressTimer() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!onToggleFavorite) return;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressFiredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onToggleFavorite();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const start = pressStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) clearPressTimer();
  }

  function handleCardClick() {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    setFlipped((f) => !f);
  }

  useEffect(() => {
    if (!flipped) return;
    fetch(`/api/cards/${card.id}/view`, { method: "POST" }).catch(() => {});
  }, [flipped, card.id]);

  useEffect(() => {
    if (!flipped) return;

    let timer: ReturnType<typeof setTimeout>;
    const scheduleFlipBack = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setFlipped(false), AUTO_FLIP_BACK_MS);
    };

    scheduleFlipBack();
    const node = backScrollRef.current;
    node?.addEventListener("scroll", scheduleFlipBack);

    return () => {
      clearTimeout(timer);
      node?.removeEventListener("scroll", scheduleFlipBack);
    };
  }, [flipped]);

  useEffect(() => clearPressTimer, []);

  return (
    <div
      className={`rounded-2xl ${card.isFavorite ? "card-favorite-glow" : ""}`}
    >
      <div
        className="flip-card aspect-[3/4]"
        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onContextMenu={(e) => {
          if (onToggleFavorite) e.preventDefault();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f);
        }}
      >
        <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
          <div
            className={`flip-card-face flip-card-front text-white ${
              customColor ? "" : `bg-gradient-to-br ${getCardGradient(card.universityName)}`
            }`}
            style={
              customColor
                ? {
                    backgroundImage: `linear-gradient(to bottom right, ${customColor}, ${darkenHex(customColor)})`,
                  }
                : undefined
            }
          >
            <CardFrontFace card={card} />
            <p className="mt-1.5 text-[10px] text-white/60 sm:mt-3 sm:text-xs">
              탭해서 뒤집어보기 ↺
            </p>
          </div>
          <div className="flip-card-face flip-card-back bg-white dark:bg-zinc-900">
            {(onEdit || onDelete) && (
              <div className="absolute right-2 top-2 flex gap-0">
                {onEdit && (
                  <button
                    type="button"
                    aria-label="카드 수정"
                    title="카드 수정"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-base text-black/40 hover:font-bold hover:text-indigo-500 dark:text-white/40 dark:hover:text-indigo-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    ⓔ
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    aria-label="카드 삭제"
                    title="카드 삭제"
                    className="flex h-5 w-5 items-center justify-center rounded-full text-base text-black/40 hover:font-bold hover:text-rose-500 dark:text-white/40 dark:hover:text-rose-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("이 카드를 삭제할까요?")) onDelete();
                    }}
                  >
                    ⓓ
                  </button>
                )}
              </div>
            )}
            <div className="mb-1 border-b border-black/10 pb-2 dark:border-white/10">
              <p className="text-xs font-medium uppercase tracking-wide text-black/50 dark:text-white/50 sm:text-base">
                {card.admissionType || "전형 미입력"}
              </p>
              <h3 className="text-sm font-bold leading-tight text-black dark:text-white sm:text-xl">
                {card.universityName}
              </h3>
              <p className="text-xs text-black/60 dark:text-white/60 sm:text-base">
                {card.department}
                {card.capacity && ` · ${card.capacity}`}
              </p>
            </div>
            <dl
              ref={backScrollRef}
              className="-mr-[0.85rem] flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-[0.85rem] text-xs sm:-mr-5 sm:gap-3 sm:pr-5 sm:text-base"
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
          </div>
        </div>
      </div>
    </div>
  );
}
