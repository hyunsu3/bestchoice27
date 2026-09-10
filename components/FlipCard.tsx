"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { getAutoHex } from "@/lib/cardColor";
import type { ApplicationStatus, UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

const LONG_PRESS_MS = 1000;
const LONG_PRESS_MOVE_TOLERANCE = 10;

// 지원 상태별 체크 아이콘/글자색/하단 바 색. 클릭할 때마다 0 → 1 → 2 → 0 순서로 돈다.
const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { glyph: string; label: string; textClass: string; barClass: string }
> = {
  0: { glyph: "☐", label: "미지원", textClass: "text-white/60", barClass: "" },
  1: {
    glyph: "◐",
    label: "지원예정",
    textClass: "text-amber-400",
    barClass: "bg-amber-500",
  },
  2: {
    glyph: "✔",
    label: "지원완료",
    textClass: "text-green-400",
    barClass: "bg-green-600",
  },
};

export default function FlipCard({
  card,
  onOpen,
  onCyclePickTier,
  onToggleMarked,
  onCycleApplied,
}: {
  card: UniversityCard;
  onOpen: () => void;
  onCyclePickTier?: () => void;
  onToggleMarked?: () => void;
  onCycleApplied?: () => void;
}) {
  const { colors, ready: colorsReady } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];
  const statusMeta = APPLICATION_STATUS_META[card.applicationStatus];

  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressFiredRef = useRef(false);

  function clearPressTimer() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressStartRef.current = null;
    window.removeEventListener("scroll", clearPressTimer, true);
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!onCyclePickTier) return;
    // 멀티터치나 중복 pointerdown(모바일 브라우저에서 간혹 발생)으로 타이머가
    // 두 개 걸리면 한 번의 롱프레스로 등급이 두 단계 넘어가 버린다. 이미 눌림
    // 처리 중이면 무시해서 타이머가 항상 하나만 걸리도록 한다.
    if (pressTimerRef.current || !e.isPrimary) return;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressFiredRef.current = false;
    // 스크롤 중엔 손가락 이동량이 작아도(10px 미만) 길게 누르기가 발동하지
    // 않도록, 어떤 스크롤(페이지든 카드 뒷면 내부든)이든 감지되면 즉시 취소한다.
    // 모바일 브라우저는 스크롤 시작 시 pointercancel을 안정적으로 보내지 않는다.
    window.addEventListener("scroll", clearPressTimer, {
      capture: true,
      passive: true,
    });
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null;
      longPressFiredRef.current = true;
      onCyclePickTier();
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
    onOpen();
  }

  useEffect(() => clearPressTimer, []);

  return (
    <div
      className={`rounded-2xl ${
        card.marked ? "ring-2 ring-[#FEE500] sm:ring-[5px]" : ""
      } ${card.held ? "opacity-70" : ""}`}
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
          if (onCyclePickTier) e.preventDefault();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
      >
        <div className="flip-card-inner">
          <div
            className={`flip-card-face flip-card-front text-white ${
              !colorsReady ? "animate-pulse bg-zinc-300 dark:bg-zinc-700" : ""
            } ${card.applicationStatus !== 0 ? "has-applied-bar" : ""}`}
            style={
              colorsReady
                ? {
                    backgroundColor: customColor || getAutoHex(card.universityName),
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 2px, transparent 2px, transparent 7px)",
                  }
                : undefined
            }
          >
            <div className="absolute right-2 top-2 z-[60] flex flex-col items-end gap-1 sm:right-3 sm:top-3">
              {card.minRequirement && card.minRequirement.trim() !== "없음" && (
                <span
                  aria-hidden
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold leading-none text-white sm:h-8 sm:w-8 sm:text-[11px]"
                >
                  최저
                </span>
              )}
            </div>
            {onToggleMarked && (
              <button
                type="button"
                aria-label={card.marked ? "카드 테두리 표시 끄기" : "카드 테두리 표시 켜기"}
                title={card.marked ? "테두리 표시 끄기" : "테두리 표시 켜기"}
                className={`absolute right-2 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-sm leading-none text-white/70 hover:bg-black/30 sm:right-3 sm:h-7 sm:w-7 sm:text-base ${
                  card.applicationStatus !== 0
                    ? "bottom-8 sm:bottom-9"
                    : "bottom-2 sm:bottom-3"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMarked();
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                📌
              </button>
            )}
            {colorsReady && <CardFrontFace card={card} />}
            {(card.interviewDate || card.latestRatioText) && (
              <p className="mt-1.5 pl-[1em] text-[10px] text-white/60 sm:mt-3 sm:text-xs">
                {card.interviewDate && `면접 ${card.interviewDate}`}
                {card.interviewDate && card.latestRatioText && " "}
                {card.latestRatioText && `(${card.latestRatioText})`}
              </p>
            )}
            {(card.applicationPeriod || onCycleApplied) && (
              <p className="mt-1 pl-[1em] text-[10px] font-semibold text-white/60 sm:text-xs">
                {onCycleApplied && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`지원 상태: ${statusMeta.label} (클릭하여 변경)`}
                    title={`지원 상태: ${statusMeta.label} (클릭하여 변경)`}
                    className={`mr-1 cursor-pointer ${statusMeta.textClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCycleApplied();
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                  >
                    {statusMeta.glyph}
                  </span>
                )}
                {card.applicationPeriod}
              </p>
            )}
            {card.applicationStatus !== 0 && (
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 bottom-0 py-1 text-center text-[10px] font-bold tracking-wide text-white sm:py-1.5 sm:text-xs ${statusMeta.barClass}`}
              >
                {statusMeta.glyph} {statusMeta.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
