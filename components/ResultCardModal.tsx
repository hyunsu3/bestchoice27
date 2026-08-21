"use client";

import { useEffect, useState } from "react";
import { darkenHex, getCardGradient } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

export default function ResultCardModal({
  card,
  onClose,
}: {
  card: UniversityCard;
  onClose: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const { colors } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
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
        className="flip-card h-[28rem] w-72 sm:h-[32rem] sm:w-80"
        onClick={(e) => {
          e.stopPropagation();
          setFlipped((f) => !f);
        }}
      >
        <div className={`flip-card-inner ${flipped ? "is-flipped" : ""}`}>
          <div
            className={`flip-card-face flip-card-front cursor-pointer text-white ${
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
            <CardFrontFace card={card} size="lg" />
            <p className="mt-3 text-xs text-white/60">탭해서 뒤집어보기 ↺</p>
          </div>
          <div className="flip-card-face flip-card-back cursor-pointer bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFlipped((f) => !f);
              }}
              className="absolute right-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs font-semibold text-black/70 shadow-sm hover:bg-white dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70"
            >
              ↺ 뒤집기
            </button>
            <dl
              className="mt-7 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto text-base"
              style={{ touchAction: "pan-y" }}
            >
              <div>
                <dt className="font-semibold text-black/60 dark:text-white/60">
                  모집인원
                </dt>
                <dd>{card.capacity || "-"}</dd>
              </div>
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
