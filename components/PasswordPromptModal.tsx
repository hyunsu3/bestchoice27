"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  resolvePasswordPrompt,
  subscribePasswordPrompt,
} from "@/lib/passwordPrompt";

export default function PasswordPromptModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(
    () =>
      subscribePasswordPrompt((next) => {
        setOpen(next);
        if (next) setValue("");
      }),
    [],
  );

  if (!open) return null;

  function submit(e: FormEvent) {
    e.preventDefault();
    resolvePasswordPrompt(value);
  }

  return (
    <div className="modal-dim fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <p className="mb-3 text-sm font-semibold text-black/80 dark:text-white/80">
          비밀번호를 입력하세요
        </p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input w-full"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => resolvePasswordPrompt(null)}
            className="rounded-full px-4 py-2 text-sm font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            취소
          </button>
          <button type="submit" className="btn-primary">
            확인
          </button>
        </div>
      </form>
    </div>
  );
}
