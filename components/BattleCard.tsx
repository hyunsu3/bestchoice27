"use client";

import { useEffect, useState } from "react";
import { getCardAccent } from "@/lib/cardColor";
import { renderWithBold } from "@/lib/formatText";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";

export default function BattleCard({
  card,
  origin,
  onPick,
}: {
  card: UniversityCard;
  origin: "left" | "right";
  onPick: () => void;
}) {
  const [entered, setEntered] = useState(false);
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

  return (
    <button
      onClick={onPick}
      className={`vs-card ${origin === "left" ? "vs-card-from-left" : "vs-card-from-right"} ${
        entered ? "vs-card-entered" : ""
      } flex h-96 w-60 flex-col rounded-2xl border border-black/10 bg-white p-5 text-left shadow-lg transition-shadow hover:shadow-2xl dark:border-white/10 dark:bg-zinc-900 sm:h-[28rem] sm:w-72`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${accentClass}`}
        style={accentStyle}
      >
        {card.admissionType || "전형 미입력"}
      </p>
      <h3 className="mt-2 text-lg font-bold leading-tight">
        {card.universityName}
      </h3>
      <p className="mt-1 text-sm text-black/70 dark:text-white/70">
        {card.department}
      </p>
      <div className="mt-3 space-y-2 overflow-hidden text-xs text-black/60 dark:text-white/60">
        <p>
          <span className="font-semibold">모집인원</span> {card.capacity || "-"}
        </p>
        <p className="line-clamp-3">
          <span className="font-semibold">전형요약</span>{" "}
          {card.admissionSummary ? renderWithBold(card.admissionSummary) : "-"}
        </p>
        <p className="line-clamp-4">
          <span className="font-semibold">입결요약</span>{" "}
          {card.resultSummary ? renderWithBold(card.resultSummary) : "-"}
        </p>
      </div>
      <span
        className={`mt-auto pt-2 text-sm font-semibold ${accentClass}`}
        style={accentStyle}
      >
        이 카드 선택하기 →
      </span>
    </button>
  );
}
