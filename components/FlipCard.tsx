"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { getAutoHex } from "@/lib/cardColor";
import { PICK_TIER_COLORS, PICK_TIER_REACH_ICON } from "@/lib/pickTier";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

const LONG_PRESS_MS = 1000;
const LONG_PRESS_MOVE_TOLERANCE = 10;

export default function FlipCard({
  card,
  onOpen,
  onCyclePickTier,
  onMoveLeft,
  onMoveRight,
}: {
  card: UniversityCard;
  onOpen: () => void;
  onCyclePickTier?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}) {
  const { colors, ready: colorsReady } = useUniversityColors();
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
    <div className="rounded-2xl">
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
            }`}
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
            {card.pickTier === "reach" && (
              <span
                aria-hidden
                className="absolute right-1 top-2 text-2xl sm:right-2 sm:top-3 sm:text-3xl"
              >
                {PICK_TIER_REACH_ICON}
              </span>
            )}
            {(card.pickTier === "safe" || card.pickTier === "target") && (
              <span
                aria-hidden
                className="absolute right-2 top-2 h-3.5 w-3.5 rounded-full sm:right-3 sm:top-3 sm:h-4 sm:w-4"
                style={{ backgroundColor: PICK_TIER_COLORS[card.pickTier] }}
              />
            )}
            {colorsReady && <CardFrontFace card={card} />}
            <p className="mt-1.5 text-[10px] text-white/60 sm:mt-3 sm:text-xs">
              탭해서 자세히 보기
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
