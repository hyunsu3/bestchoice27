"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { unlockView, useViewUnlocked } from "@/lib/viewLock";

export default function ViewGate({ children }: { children: ReactNode }) {
  const unlocked = useViewUnlocked();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ok = await unlockView(value);
      if (!ok) setError("비밀번호가 올바르지 않습니다.");
    } catch {
      setError("확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {children}
      {!unlocked && (
        <div className="modal-dim fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:bg-black/60">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
          >
            <p className="mb-3 text-sm font-semibold text-black/80 dark:text-white/80">
              비밀번호를 입력하세요
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              name="access-code"
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input w-full"
            />
            {error && (
              <p className="mt-2 text-xs font-medium text-rose-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !value}
              className="btn-primary mt-4 w-full disabled:opacity-60"
            >
              {submitting ? "확인 중..." : "확인"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
