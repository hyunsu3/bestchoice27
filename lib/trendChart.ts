import { getDeadlineTimestamp } from "./deadlineInfo";
import type { ApplicationStat, UniversityCard } from "./types";

const VIEW_W = 100;
const VIEW_H = 30;
const TOP_PAD = 4;

export interface TrendPaths {
  viewBox: string;
  line: string;
  area: string;
  lastValue: number;
  // 마지막 기록 지점의 위치를 박스 기준 %로 환산한 값 (라벨을 그 지점 옆에
  // HTML로 겹쳐 그릴 때, SVG의 비균등 스케일(preserveAspectRatio=none) 영향을
  // 받지 않게 하기 위함).
  lastXPercent: number;
  lastYPercent: number;
}

function parseCapacityNumber(capacity: string): number | null {
  const match = capacity.match(/\d+/);
  return match ? Number(match[0]) : null;
}

// 학과 정보 박스 안에 무늬처럼 깔리는 지원현황 추이 미니 그래프 좌표 계산.
// 마감일이 마지막 기록보다 미래면 x축을 마감일까지 늘려서, 마감까지
// 얼마나 남았는지가 그래프 폭 안에 자연히 드러나게 한다.
// y축은 모집 정원을 100%(그래프 최상단)로 두어, 정원 대비 지원 현황이
// 얼마나 찼는지가 한눈에 보이게 한다. 정원이 없으면 기록된 최대 지원자
// 수를 기준으로 삼는다.
export function buildTrendPaths(
  stats: ApplicationStat[] | undefined,
  card: UniversityCard,
): TrendPaths | null {
  if (!stats || stats.length < 2) return null;
  const times = stats.map((s) => s.recordedAt);
  const minT = Math.min(...times);
  const lastT = Math.max(...times);
  const deadlineMs = getDeadlineTimestamp(card);
  const maxT = deadlineMs && deadlineMs > lastT ? deadlineMs : lastT;
  const span = maxT - minT || 1;
  const capacity = parseCapacityNumber(card.capacity);
  const maxCount =
    capacity && capacity > 0
      ? capacity
      : Math.max(...stats.map((s) => s.applicantCount), 1);
  const points = stats.map((s) => ({
    x: ((s.recordedAt - minT) / span) * VIEW_W,
    // 정원을 넘는 지원자 수는 100%(그래프 맨 위)에서 그대로 눌러 담아, 박스
    // 바깥으로 밀려나 그래프 자체가 안 보이는 일이 없게 한다.
    y: VIEW_H - Math.min(s.applicantCount / maxCount, 1) * (VIEW_H - TOP_PAD),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${VIEW_H} L${points[0].x},${VIEW_H} Z`;
  const lastPoint = points[points.length - 1];
  return {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    line,
    area,
    lastValue: stats[stats.length - 1].applicantCount,
    lastXPercent: (lastPoint.x / VIEW_W) * 100,
    lastYPercent: (lastPoint.y / VIEW_H) * 100,
  };
}
