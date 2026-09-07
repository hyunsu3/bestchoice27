"use client";

import { useEffect, useMemo, useState } from "react";
import { authorizedFetch } from "@/lib/authorizedFetch";
import { getDeadlineStatus } from "@/lib/deadlineInfo";
import type { ApplicationStat, UniversityCard } from "@/lib/types";

const CHART_W = 300;
const CHART_H = 96;
const PAD = { top: 14, right: 10, bottom: 10, left: 10 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateTime(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function parseCapacityNumber(capacity: string): number | null {
  const match = capacity.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function formatRatio(count: number, capacity: number | null): string | null {
  if (!capacity) return null;
  return `${(count / capacity).toFixed(1)}:1`;
}

function deadlineInfo(card: UniversityCard): { label: string; urgent: boolean } | null {
  const status = getDeadlineStatus(card);
  if (!status) return null;
  const { diffDays, dateLabel } = status;
  if (diffDays > 0) return { label: `D-${diffDays} · ${dateLabel}`, urgent: diffDays <= 3 };
  if (diffDays === 0) return { label: `오늘 마감 · ${dateLabel}`, urgent: true };
  return { label: `마감 · ${dateLabel}`, urgent: false };
}

export default function ApplicationStatsPanel({ card }: { card: UniversityCard }) {
  const [stats, setStats] = useState<ApplicationStat[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState(nowTimeStr());
  const [count, setCount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/cards/${card.id}/stats`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: ApplicationStat[]) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats([]);
      });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const capacity = parseCapacityNumber(card.capacity);
  const deadline = deadlineInfo(card);
  const yearRatios: { year: string; value: string }[] = [
    { year: "2024", value: card.ratio2024 },
    { year: "2025", value: card.ratio2025 },
    { year: "2026", value: card.ratio2026 },
  ].filter((r) => r.value.trim() !== "");

  const points = useMemo(() => {
    if (!stats || stats.length === 0) return [];
    const times = stats.map((s) => s.recordedAt);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const maxCount = Math.max(...stats.map((s) => s.applicantCount), 1);
    return stats.map((s, i) => {
      const x =
        stats.length === 1
          ? PAD.left + PLOT_W / 2
          : PAD.left + ((s.recordedAt - minT) / (maxT - minT || 1)) * PLOT_W;
      const y = PAD.top + PLOT_H - (s.applicantCount / maxCount) * PLOT_H;
      return { x, y, stat: s, isLast: i === stats.length - 1 };
    });
  }, [stats]);

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const lastPoint = points[points.length - 1];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(count);
    if (!date || !Number.isFinite(n) || n < 0) return;
    const recordedAt = new Date(`${date}T${time || "00:00"}:00`).getTime();
    if (Number.isNaN(recordedAt)) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authorizedFetch(`/api/cards/${card.id}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordedAt, applicantCount: n }),
      });
      if (!res.ok) throw new Error();
      const created = (await res.json()) as ApplicationStat;
      setStats((prev) =>
        [...(prev ?? []), created].sort((a, b) => a.recordedAt - b.recordedAt),
      );
      setCount("");
      setTime(nowTimeStr());
    } catch {
      setError("기록을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    try {
      const res = await authorizedFetch(`/api/cards/${card.id}/stats/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setStats((prev) => (prev ?? []).filter((s) => s.id !== id));
    } catch {
      window.alert("기록을 삭제하지 못했습니다.");
    }
  }

  const hovered = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div
      className="mt-3 rounded-xl border border-black/10 p-3 dark:border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <h4 className="text-sm font-bold text-black/80 dark:text-white/80">
          경쟁률 · 지원현황
        </h4>
        {deadline && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              deadline.urgent
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : "bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60"
            }`}
          >
            {deadline.label}
          </span>
        )}
      </div>

      {yearRatios.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {yearRatios.map((r) => (
            <span
              key={r.year}
              className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/60 dark:bg-white/10 dark:text-white/60"
            >
              {r.year} {r.value}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3">
        {stats === null ? (
          <p className="text-xs text-black/40 dark:text-white/40">불러오는 중...</p>
        ) : stats.length === 0 ? (
          <p className="text-xs text-black/40 dark:text-white/40">
            아직 지원현황 기록이 없어요. 아래에서 첫 기록을 입력해보세요.
          </p>
        ) : (
          <div className="relative w-full" style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="h-full w-full overflow-visible">
              {[0, 0.5, 1].map((f) => (
                <line
                  key={f}
                  x1={PAD.left}
                  x2={CHART_W - PAD.right}
                  y1={PAD.top + PLOT_H * f}
                  y2={PAD.top + PLOT_H * f}
                  className="stroke-black/10 dark:stroke-white/10"
                  strokeWidth={1}
                />
              ))}
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  className="stroke-indigo-500 dark:stroke-indigo-400"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {points.map((p, i) => (
                <g key={p.stat.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={9}
                    fill="transparent"
                    className="cursor-pointer"
                    onPointerEnter={() => setHoverIdx(i)}
                    onPointerLeave={() => setHoverIdx((h) => (h === i ? null : h))}
                    onClick={() => setHoverIdx(i)}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.isLast ? 3.5 : 2.5}
                    className="fill-indigo-500 dark:fill-indigo-400"
                  />
                </g>
              ))}
              {lastPoint && (
                <text
                  x={lastPoint.x}
                  y={Math.max(lastPoint.y - 8, 8)}
                  textAnchor="middle"
                  className="fill-black/70 text-[9px] font-bold dark:fill-white/70"
                >
                  {lastPoint.stat.applicantCount}명
                  {formatRatio(lastPoint.stat.applicantCount, capacity)
                    ? ` (${formatRatio(lastPoint.stat.applicantCount, capacity)})`
                    : ""}
                </text>
              )}
            </svg>
            {hovered && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-black/80 px-2 py-1 text-[10px] whitespace-nowrap text-white dark:bg-white/90 dark:text-black"
                style={{
                  left: `${(hovered.x / CHART_W) * 100}%`,
                  top: `${(hovered.y / CHART_H) * 100}%`,
                }}
              >
                {formatDateTime(hovered.stat.recordedAt)} · {hovered.stat.applicantCount}명
                {formatRatio(hovered.stat.applicantCount, capacity)
                  ? ` · ${formatRatio(hovered.stat.applicantCount, capacity)}`
                  : ""}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-3 flex flex-wrap items-end gap-1.5">
        <input
          type="date"
          className="input flex-1 basis-28 text-xs"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          type="time"
          className="input flex-1 basis-20 text-xs"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          className="input w-20 text-xs"
          placeholder="지원자 수"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary shrink-0 px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {submitting ? "저장 중..." : "기록 추가"}
        </button>
      </form>
      {error && <p className="mt-1 text-xs font-medium text-rose-500">{error}</p>}

      {stats && stats.length > 0 && (
        <ul className="thin-scrollbar mt-2 max-h-24 space-y-1 overflow-y-auto text-xs">
          {[...stats].reverse().map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 text-black/60 dark:text-white/60"
            >
              <span>
                {formatDateTime(s.recordedAt)} · {s.applicantCount}명
              </span>
              <button
                type="button"
                aria-label="기록 삭제"
                title="기록 삭제"
                className="shrink-0 text-black/30 hover:text-rose-500 dark:text-white/30 dark:hover:text-rose-400"
                onClick={() => handleDelete(s.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
