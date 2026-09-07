import type { UniversityCard } from "./types";

export interface DeadlineStatus {
  diffDays: number;
  dateLabel: string;
}

type DeadlineFields = Pick<UniversityCard, "applyDeadlineDate" | "applyDeadlineTime">;

export function getDeadlineTimestamp(card: DeadlineFields): number | null {
  if (!card.applyDeadlineDate) return null;
  const deadline = new Date(
    `${card.applyDeadlineDate}T${card.applyDeadlineTime || "00:00"}:00`,
  );
  if (Number.isNaN(deadline.getTime())) return null;
  return deadline.getTime();
}

export function getDeadlineStatus(card: DeadlineFields): DeadlineStatus | null {
  const deadlineMs = getDeadlineTimestamp(card);
  if (deadlineMs === null) return null;
  const diffDays = Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24));
  const timeLabel = card.applyDeadlineTime ? ` ${card.applyDeadlineTime}` : "";
  const dateLabel = `${card.applyDeadlineDate.slice(5).replace("-", "/")}${timeLabel}`;
  return { diffDays, dateLabel };
}
