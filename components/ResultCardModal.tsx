"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getAutoHex } from "@/lib/cardColor";
import { renderWithBold, renderWithSmall } from "@/lib/formatText";
import { PICK_TIER_COLORS, PICK_TIER_EMOJIS } from "@/lib/pickTier";
import type { UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";
import CardFrontFace from "./CardFrontFace";

export default function ResultCardModal({
  card,
  onClose,
  onEdit,
  onDelete,
  onSetHeld,
  initialFlipped = false,
}: {
  card: UniversityCard;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetHeld?: (held: boolean) => void;
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
    // 스크롤바가 사라지면서 본문 너비가 늘어나 화면이 옆으로 살짝
    // 튀는 현상을 막기 위해, 사라지는 만큼 오른쪽 여백으로 메워준다.
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(
        window.getComputedStyle(body).paddingRight || "0",
      );
      body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.top = prev.bodyTop;
      body.style.width = prev.bodyWidth;
      body.style.paddingRight = prev.bodyPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/90 sm:bg-black/60" />
      <div className="flex min-h-full items-center justify-center p-2">
        <div
          className="flip-card result-card-shell relative"
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
              className={`flip-card-face flip-card-front cursor-pointer text-white result-card-flat ${
                !colorsReady ? "animate-pulse bg-zinc-300 dark:bg-zinc-700" : ""
              } ${card.held ? "grayscale" : ""}`}
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
              <div className="absolute left-2 top-2 z-[60] flex flex-col items-start gap-1 sm:left-3 sm:top-3">
                {card.held && (
                  <span
                    aria-hidden
                    className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white"
                  >
                    보류
                  </span>
                )}
                {card.pickTier !== "none" &&
                  (PICK_TIER_EMOJIS[card.pickTier] ? (
                    <span aria-hidden className="text-4xl leading-none drop-shadow">
                      {PICK_TIER_EMOJIS[card.pickTier]}
                    </span>
                  ) : (
                    <span
                      aria-hidden
                      className="h-4 w-4 rounded-full sm:h-5 sm:w-5"
                      style={{ backgroundColor: PICK_TIER_COLORS[card.pickTier] }}
                    />
                  ))}
              </div>
              <div className="mt-3 ml-1 flex h-[90%] flex-col">
                {colorsReady && <CardFrontFace card={card} size="lg" />}
              </div>
            </div>
            <div className="flip-card-face result-card-face result-card-flat flip-card-back cursor-pointer bg-white dark:bg-zinc-900">
              <div className="flex h-[99%] min-h-0 flex-col">
                <div className="mt-3 border-b border-black/10 pb-3 pl-3 pr-16 dark:border-white/10 sm:pl-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-black/60 dark:text-white/60 sm:text-base">
                    {card.admissionType || "전형 미입력"}
                  </p>
                  <h3 className="mt-1 flex items-center gap-1.5 text-xl font-black leading-tight text-black dark:text-white sm:text-2xl">
                    {renderWithSmall(card.universityName)}
                    {card.pickTier !== "none" &&
                      (PICK_TIER_EMOJIS[card.pickTier] ? (
                        <span aria-hidden className="shrink-0 text-3xl leading-none">
                          {PICK_TIER_EMOJIS[card.pickTier]}
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-full sm:h-3.5 sm:w-3.5"
                          style={{ backgroundColor: PICK_TIER_COLORS[card.pickTier] }}
                        />
                      ))}
                  </h3>
                  <p className="mt-1 text-base font-semibold text-black/80 dark:text-white/80 sm:text-lg">
                    {card.department}
                    {card.capacity && (
                      <>
                        {" · "}
                        {renderWithSmall(card.capacity)}
                      </>
                    )}
                  </p>
                  {card.minRequirement && (
                    <p className="mt-1 text-lg font-medium text-black/60 dark:text-white/60 sm:text-xl">
                      수능최저 {card.minRequirement}
                    </p>
                  )}
                  {(card.interviewDate || card.resultAnnouncementDate || card.departmentLink) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {card.interviewDate && (
                        <span
                          aria-label={`면접일 ${card.interviewDate}`}
                          className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70 sm:text-sm"
                        >
                          <span aria-hidden>📅</span>
                          면접 {card.interviewDate}
                        </span>
                      )}
                      {card.resultAnnouncementDate && (
                        <span
                          aria-label={`합격자 발표 ${card.resultAnnouncementDate}`}
                          className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70 sm:text-sm"
                        >
                          <span aria-hidden>📢</span>
                          {card.resultAnnouncementDate}
                        </span>
                      )}
                      {card.departmentLink && (
                        <a
                          href={card.departmentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="학과 소개 링크 (새 창)"
                          aria-label="학과 소개 링크 새 창으로 열기"
                          className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400 sm:text-sm"
                        >
                          <span aria-hidden>🔗</span>
                          학과 소개
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <dl
                  className="thin-scrollbar mt-3 min-h-0 flex-1 overflow-y-auto text-base sm:text-lg"
                  style={{ touchAction: "pan-y" }}
                >
                  <div className="ml-3 sm:ml-0">
                    <dt className="font-semibold text-black/60 dark:text-white/60">
                      전형요약
                    </dt>
                    <dd className="whitespace-pre-wrap">
                      {card.admissionSummary ? renderWithBold(card.admissionSummary) : "-"}
                    </dd>
                    <dt className="mt-3 font-semibold text-black/60 dark:text-white/60">
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
          {(onEdit || onDelete || onSetHeld) && !flipped && (
            <div className="absolute bottom-[1.65rem] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1.5">
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    type="button"
                    aria-label="카드 수정"
                    title="카드 수정"
                    className="rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-white hover:text-indigo-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-indigo-400 sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    수정
                  </button>
                )}
                {onSetHeld && !card.held && (
                  <button
                    type="button"
                    aria-label="카드 보류"
                    title="카드 보류"
                    className="rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-white hover:text-rose-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-rose-400 sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        window.confirm(
                          "이 카드를 보류할까요? 목록 맨 뒤로 이동하고 흐리게 표시돼요.",
                        )
                      ) {
                        onSetHeld(true);
                        onClose();
                      }
                    }}
                  >
                    보류
                  </button>
                )}
                {onSetHeld && card.held && (
                  <button
                    type="button"
                    aria-label="카드 보류 해제"
                    title="카드 보류 해제"
                    className="rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm font-semibold text-black/70 shadow-sm hover:bg-white hover:text-indigo-500 dark:border-white/10 dark:bg-zinc-800/90 dark:text-white/70 dark:hover:text-indigo-400 sm:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetHeld(false);
                      onClose();
                    }}
                  >
                    복구
                  </button>
                )}
              </div>
              {onDelete && card.held && (
                <button
                  type="button"
                  aria-label="카드 완전 삭제"
                  title="카드 완전 삭제"
                  className="text-xs font-medium text-black/40 underline decoration-dotted hover:text-rose-500 dark:text-white/40 dark:hover:text-rose-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        "이 카드를 완전히 삭제할까요? 이 작업은 되돌릴 수 없어요.",
                      )
                    ) {
                      onDelete();
                      onClose();
                    }
                  }}
                >
                  완전 삭제
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
