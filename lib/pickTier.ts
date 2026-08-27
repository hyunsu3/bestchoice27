import type { PickTier } from "./types";

// 1(안정) → 2(적정) → 3(상향) → 해제, 반복.
export const PICK_TIER_ORDER: PickTier[] = ["none", "safe", "target", "reach"];

export const PICK_TIER_LABELS: Record<PickTier, string> = {
  none: "해제",
  reach: "상향",
  target: "적정",
  safe: "안정",
};

export const PICK_TIER_COLORS: Record<PickTier, string> = {
  none: "",
  safe: "#4ade80",
  target: "#facc15",
  reach: "#ff4500",
};

// 롱프레스로 등급을 한 단계 올릴 때마다 pick_rank에 누적으로 더해주는 값
// (안정→적정→상향 순서로 지나가며 100, 200, 300씩 더해짐). 상향에서 한 번 더
// 눌러 해제로 돌아갈 때는 그 사이 쌓인 전체 합(100+200+300=600)을 빼서 한 바퀴
// 돌면 처음 값으로 정확히 되돌아오게 한다.
export const PICK_TIER_RANK_DELTA: Record<PickTier, number> = {
  none: -600,
  safe: 100,
  target: 200,
  reach: 300,
};

export function nextPickTier(tier: PickTier): PickTier {
  const idx = PICK_TIER_ORDER.indexOf(tier);
  return PICK_TIER_ORDER[(idx + 1) % PICK_TIER_ORDER.length];
}
