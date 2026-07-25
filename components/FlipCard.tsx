"use client";

import { useEffect, useRef, useState } from "react";
import { darkenHex, getCardGradient } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";

const AUTO_FLIP_BACK_MS = 20000;

export default function FlipCard({
  card,
  onEdit,
  onDelete,
}: {
  card: UniversityCard;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const backScrollRef = useRef<HTMLDListElement>(null);
  const { colors } = useUniversityColors();
  const customColor = colors[card.universityName.trim()];

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

  return (
    <div
      className="flip-card h-80 sm:h-96"
      onClick={() => setFlipped((f) => !f)}
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
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">
            {card.admissionType || "전형 미입력"}
          </p>
          <h3 className="mt-2 text-xl font-bold leading-tight">
            {card.universityName}
          </h3>
          <p className="mt-1 text-sm text-white/90">{card.department}</p>
          <p className="mt-auto text-xs text-white/60">탭해서 뒤집어보기 ↺</p>
        </div>
        <div className="flip-card-face flip-card-back bg-white dark:bg-zinc-900">
          <dl
            ref={backScrollRef}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto text-sm"
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
          <div className="mt-2 flex gap-4">
            {onEdit && (
              <button
                className="self-start text-xs font-medium text-indigo-500 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                카드 수정
              </button>
            )}
            {onDelete && (
              <button
                className="self-start text-xs font-medium text-rose-500 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                카드 삭제
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
