import type { PickTier } from "./types";

// 1(안정) → 2(적정) → 3(상향) → 해제, 반복.
export const PICK_TIER_ORDER: PickTier[] = ["none", "safe", "target", "reach"];

export const PICK_TIER_LABELS: Record<PickTier, string> = {
  none: "해제",
  reach: "상향",
  target: "소신",
  safe: "안정",
};

// 안정(초록) - 소신(노랑) - 상향(퍼플) 순서로 원형 배지 색을 매긴다.
export const PICK_TIER_COLORS: Record<PickTier, string> = {
  none: "",
  safe: "#4ade80",
  target: "#facc15",
  reach: "#a855f7",
};

export function nextPickTier(tier: PickTier): PickTier {
  const idx = PICK_TIER_ORDER.indexOf(tier);
  return PICK_TIER_ORDER[(idx + 1) % PICK_TIER_ORDER.length];
}
