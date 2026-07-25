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
