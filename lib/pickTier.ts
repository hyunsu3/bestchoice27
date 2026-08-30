import type { PickTier } from "./types";

// 1(안정) → 2(적정) → 3(상향) → 4(우주상향) → 해제, 반복.
export const PICK_TIER_ORDER: PickTier[] = [
  "none",
  "safe",
  "target",
  "reach",
  "cosmicReach",
];

export const PICK_TIER_LABELS: Record<PickTier, string> = {
  none: "해제",
  reach: "상향",
  target: "소신",
  safe: "안정",
  cosmicReach: "우주상향",
};

// 안정(초록) - 소신(노랑) - 상향(퍼플) - 우주상향(인디고) 순서로 원형 배지 색을 매긴다.
export const PICK_TIER_COLORS: Record<PickTier, string> = {
  none: "",
  safe: "#4ade80",
  target: "#facc15",
  reach: "#a855f7",
  cosmicReach: "#6366f1",
};

// 우주상향만 원형 배지 안에 로켓 이모지를 얹어 다른 등급과 시각적으로 구분한다.
export const PICK_TIER_EMOJIS: Partial<Record<PickTier, string>> = {
  cosmicReach: "🚀",
};

export function nextPickTier(tier: PickTier): PickTier {
  const idx = PICK_TIER_ORDER.indexOf(tier);
  return PICK_TIER_ORDER[(idx + 1) % PICK_TIER_ORDER.length];
}
