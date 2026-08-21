import type { UniversityCard } from "./types";

export type MatchQueueItem =
  | { type: "pair"; left: UniversityCard; right: UniversityCard }
  | { type: "bye"; card: UniversityCard };

export const FINAL_COUNT = 6;

export function shuffle<T>(list: T[]): T[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildRoundQueue(cards: UniversityCard[]): MatchQueueItem[] {
  const shuffled = shuffle(cards);
  const queue: MatchQueueItem[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      queue.push({ type: "pair", left: shuffled[i], right: shuffled[i + 1] });
    } else {
      queue.push({ type: "bye", card: shuffled[i] });
    }
  }
  return queue;
}

// Plain halving (buildRoundQueue) doesn't land on exactly FINAL_COUNT winners
// for most starting counts — it can overshoot below it. Once the pool is
// small enough to finish in one more round, play just enough matches
// (poolSize - finalCount) to eliminate exactly that many, and let the rest
// bye through, so the round lands on exactly `finalCount` winners.
export function buildFinalRoundQueue(
  cards: UniversityCard[],
  finalCount: number,
): MatchQueueItem[] {
  const shuffled = shuffle(cards);
  const matchCount = cards.length - finalCount;
  const queue: MatchQueueItem[] = [];
  for (let i = 0; i < matchCount; i++) {
    queue.push({ type: "pair", left: shuffled[i * 2], right: shuffled[i * 2 + 1] });
  }
  for (let i = matchCount * 2; i < shuffled.length; i++) {
    queue.push({ type: "bye", card: shuffled[i] });
  }
  return queue;
}

export function buildNextRoundQueue(
  cards: UniversityCard[],
  finalCount: number,
): MatchQueueItem[] {
  if (cards.length > finalCount && cards.length <= finalCount * 2) {
    return buildFinalRoundQueue(cards, finalCount);
  }
  return buildRoundQueue(cards);
}
