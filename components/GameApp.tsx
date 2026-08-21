"use client";

import { useState } from "react";
import { useCards } from "@/lib/useCards";
import CardForm from "./CardForm";
import CardList from "./CardList";
import PasswordPromptModal from "./PasswordPromptModal";
import VsMatch from "./VsMatch";

type Tab = "register" | "list" | "vs";

const TABS: { id: Tab; label: string }[] = [
  { id: "register", label: "카드 등록" },
  { id: "list", label: "카드 모아보기" },
  { id: "vs", label: "VS 대결" },
];

export default function GameApp() {
  const { cards, hydrated, addCard, removeCard, updateCard } = useCards();
  const [tab, setTab] = useState<Tab>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingCard = cards.find((c) => c.id === editingId) ?? null;

  function startEdit(id: string) {
    setEditingId(id);
    setTab("register");
  }

  function stopEdit() {
    setEditingId(null);
    setTab("list");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-8">
      <PasswordPromptModal />
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-tight">
          수시 이상형 월드컵
        </h1>
        <p className="mt-2 text-black/60 dark:text-white/60">
          내가 등록한 수시 카드로 최애 조합을 찾아보세요.
        </p>
      </header>

      <nav className="flex justify-center gap-2 rounded-full border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-white/5">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setEditingId(null);
              setTab(t.id);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-indigo-600 text-white"
                : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
            }`}
          >
            {t.label}
            {t.id === "list" && hydrated ? ` (${cards.length})` : ""}
          </button>
        ))}
      </nav>

      <main>
        {tab === "register" && (
          <CardForm
            key={editingId ?? "new"}
            editingCard={editingCard}
            onAdd={async (card) => {
              await addCard(card);
              setTab("list");
            }}
            onUpdate={async (id, patch) => {
              await updateCard(id, patch);
              stopEdit();
            }}
            onCancelEdit={stopEdit}
          />
        )}
        {tab === "list" && (
          <CardList cards={cards} onEdit={startEdit} onDelete={removeCard} />
        )}
        {tab === "vs" && hydrated && <VsMatch cards={cards} />}
      </main>
    </div>
  );
}
