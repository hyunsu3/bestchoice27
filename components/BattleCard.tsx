"use client";

import { useEffect, useRef, useState } from "react";
import { darkenHex, getCardAccent, getCardGradient } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

const FLY_IN_MS = 700;
const HOLD_MS = 550;
const DRAG_THRESHOLD_PX = 10;

export default function BattleCard({
  card,
  origin,
  selected,
  dimmed,
  onHoldSelect,
}: {
  card: UniversityCard;
  origin: "left" | "right";
  selected: boolean;
  dimmed: boolean;
  onHoldSelect: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [holding, setHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTriggeredRef = useRef(false);
  const draggedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const { colors } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];
  const accentClass = customColor ? "" : getCardAccent(card.universityName);
  const accentStyle = customColor ? { color: customColor } : undefined;

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  useEffect(() => {
    if (!entered) return;
    const timer = setTimeout(() => setFlipped(true), FLY_IN_MS);
    return () => clearTimeout(timer);
  }, [entered]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    holdTriggeredRef.current = false;
    draggedRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setHolding(true);
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      holdTriggeredRef.current = true;
      setHolding(false);
      onHoldSelect();
    }, HOLD_MS);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (draggedRef.current || !holdTimerRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      draggedRef.current = true;
      clearHoldTimer();
      setHolding(false);
    }
  }

  function handlePointerUp() {
    clearHoldTimer();
    setHolding(false);
    if (!holdTriggeredRef.current && !draggedRef.current) {
      setFlipped((f) => !f);
    }
  }

  function handlePointerLeave() {
    clearHoldTimer();
    setHolding(false);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
      style={{ touchAction: "manipulation" }}
      className={`vs-card ${origin === "left" ? "vs-card-from-left" : "vs-card-from-right"} ${
        entered ? "vs-card-entered" : ""
      } h-96 w-60 cursor-pointer select-none sm:h-[28rem] sm:w-72`}
    >
      <div
        className={`flip-card h-full w-full rounded-2xl transition-[box-shadow,opacity,filter] duration-200 ${
          selected ? "ring-4 ring-emerald-400 ring-offset-4 dark:ring-offset-zinc-950" : ""
        } ${dimmed ? "opacity-40" : "opacity-100"} ${holding ? "brightness-90" : ""}`}
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
            <p className="mt-3 text-xs text-white/60">탭해서 뒤집기</p>
          </div>
          <div className="flip-card-face flip-card-back bg-white dark:bg-zinc-900">
            <p
              className={`text-base font-medium uppercase tracking-wide ${accentClass}`}
              style={accentStyle}
            >
              {card.admissionType || "전형 미입력"}
            </p>
            <h3 className="mt-2 text-2xl font-bold leading-tight">
              {card.universityName}
            </h3>
            <p className="mt-1 text-base text-black/70 dark:text-white/70">
              {card.department}
              {card.capacity && ` · ${card.capacity}`}
            </p>
            <div
              className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto text-sm text-black/60 dark:text-white/60"
              style={{ touchAction: "pan-y" }}
            >
              <p className="whitespace-pre-wrap">
                <span className="font-semibold">전형요약</span>
                <br />
                {card.admissionSummary ? renderWithBold(card.admissionSummary) : "-"}
              </p>
              <p className="whitespace-pre-wrap">
                <span className="font-semibold">입결요약</span>
                <br />
                {card.resultSummary ? renderWithBold(card.resultSummary) : "-"}
              </p>
            </div>
            <span
              className={`mt-auto pt-2 text-base font-semibold ${accentClass}`}
              style={accentStyle}
            >
              {selected ? "선택됨 ✓ (다시 길게 누르면 해제)" : "길게 눌러 선택하기"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
