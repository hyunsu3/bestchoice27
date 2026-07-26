"use client";

import type { UniversityCard } from "@/lib/types";
import FlipCard from "./FlipCard";

export default function CardList({
  cards,
  onEdit,
  onDelete,
}: {
  cards: UniversityCard[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (cards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-black/50 dark:border-white/15 dark:text-white/50">
        아직 등록된 수시 카드가 없어요. 위에서 카드를 등록해보세요.
      </p>
    );
  }

  const sortedCards = [...cards].sort((a, b) =>
    a.universityName.localeCompare(b.universityName, "ko")
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedCards.map((card) => (
        <FlipCard
          key={card.id}
          card={card}
          onEdit={() => onEdit(card.id)}
          onDelete={() => onDelete(card.id)}
        />
      ))}
    </div>
  );
}
