"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getAutoHex, HEXES } from "@/lib/cardColor";
import type { NewUniversityCard, UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";

function normalizeHex(value: string): string | null {
  let s = value.trim();
  if (!s) return null;
  if (!s.startsWith("#")) s = `#${s}`;
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(s) ? s : null;
}

const emptyForm: NewUniversityCard = {
  universityName: "",
  department: "",
  admissionType: "",
  capacity: "",
  minRequirement: "",
  admissionSummary: "",
  resultSummary: "",
  pickRank: 0,
};

export default function CardForm({
  editingCard,
  onAdd,
  onUpdate,
  onCancelEdit,
}: {
  editingCard?: UniversityCard | null;
  onAdd: (card: NewUniversityCard) => void | Promise<void>;
  onUpdate?: (id: string, card: NewUniversityCard) => void | Promise<void>;
  onCancelEdit?: () => void;
}) {
  const [form, setForm] = useState<NewUniversityCard>(() =>
    editingCard
      ? {
          universityName: editingCard.universityName,
          department: editingCard.department,
          admissionType: editingCard.admissionType,
          capacity: editingCard.capacity,
          minRequirement: editingCard.minRequirement,
          admissionSummary: editingCard.admissionSummary,
          resultSummary: editingCard.resultSummary,
          pickRank: editingCard.pickRank,
        }
      : emptyForm,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, setUniversityColor } = useUniversityColors();

  const universityKey = form.universityName.trim();
  const customColor = universityKey ? colors[universityKey] : undefined;
  const swatchColor = customColor || getAutoHex(form.universityName);
  const [hexInput, setHexInput] = useState(swatchColor);
  useEffect(() => setHexInput(swatchColor), [swatchColor]);

  function update<K extends keyof NewUniversityCard>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.universityName.trim() || !form.department.trim()) return;
    const trimmed: NewUniversityCard = {
      universityName: form.universityName.trim(),
      department: form.department.trim(),
      admissionType: form.admissionType.trim(),
      capacity: form.capacity.trim(),
      minRequirement: form.minRequirement.trim(),
      admissionSummary: form.admissionSummary.trim(),
      resultSummary: form.resultSummary.trim(),
      pickRank: form.pickRank ?? 0,
    };
    setSubmitting(true);
    setError(null);
    try {
      if (editingCard && onUpdate) {
        await onUpdate(editingCard.id, trimmed);
      } else {
        await onAdd(trimmed);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 sm:grid-cols-2"
    >
      <Field label="대학명" required>
        <input
          className="input"
          value={form.universityName}
          onChange={(e) => update("universityName", e.target.value)}
          placeholder="예: 서울대학교"
          required
        />
      </Field>
      <Field label="희망학과" required>
        <input
          className="input"
          value={form.department}
          onChange={(e) => update("department", e.target.value)}
          placeholder="예: 컴퓨터공학부"
          required
        />
      </Field>
      <Field label="전형명">
        <input
          className="input"
          value={form.admissionType}
          onChange={(e) => update("admissionType", e.target.value)}
          placeholder="예: 학생부종합(일반전형)"
        />
      </Field>
      <Field label="모집인원">
        <input
          className="input"
          value={form.capacity}
          onChange={(e) => update("capacity", e.target.value)}
          placeholder="예: 15명"
        />
      </Field>
      <Field
        label="순서값"
        hint="같은 등급(안정/적정/상향) 안에서 정렬 순서를 정해요. 클수록 앞에 표시돼요"
      >
        <input
          type="number"
          className="input"
          value={form.pickRank ?? 0}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, pickRank: Number(e.target.value) }))
          }
        />
      </Field>
      <Field
        label="수능최저"
        full
        hint="충족 시 카드 앞면에도 표시돼요"
      >
        <input
          className="input"
          value={form.minRequirement}
          onChange={(e) => update("minRequirement", e.target.value)}
          placeholder="예: 국,수,영,탐(2) 중 3개 합 6 (한국사 4)"
        />
      </Field>
      <Field
        label="카드 색"
        hint={
          universityKey
            ? `같은 대학(${universityKey}) 카드 색이 모두 함께 바뀌어요`
            : "대학명을 먼저 입력하면 색을 지정할 수 있어요"
        }
      >
        <div className="flex items-center gap-3">
          <input
            type="color"
            className="h-9 w-14 cursor-pointer rounded-md border border-black/10 bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"
            value={swatchColor}
            disabled={!universityKey}
            onChange={(e) => setUniversityColor(form.universityName, e.target.value)}
          />
          <input
            type="text"
            className="input w-28 font-mono text-xs uppercase disabled:cursor-not-allowed disabled:opacity-40"
            value={hexInput}
            disabled={!universityKey}
            placeholder="#RRGGBB"
            onChange={(e) => {
              setHexInput(e.target.value);
              const normalized = normalizeHex(e.target.value);
              if (normalized) setUniversityColor(form.universityName, normalized);
            }}
          />
          {customColor ? (
            <button
              type="button"
              onClick={() => setUniversityColor(form.universityName, null)}
              className="text-xs font-medium text-indigo-500 hover:underline"
            >
              자동 색상으로 되돌리기
            </button>
          ) : (
            <span className="text-xs text-black/40 dark:text-white/40">
              대학명에 따라 자동으로 색이 정해져요
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {HEXES.map((hex) => (
            <button
              key={hex}
              type="button"
              disabled={!universityKey}
              onClick={() => setUniversityColor(form.universityName, hex)}
              title={hex}
              aria-label={`추천 색상 ${hex} 선택`}
              className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white transition disabled:cursor-not-allowed disabled:opacity-40 dark:ring-offset-zinc-900 ${
                swatchColor.toLowerCase() === hex.toLowerCase()
                  ? "ring-black/60 dark:ring-white/70"
                  : "ring-transparent hover:ring-black/20 dark:hover:ring-white/30"
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </Field>
      <Field label="전형요약" full>
        <textarea
          className="input min-h-40 resize-y"
          value={form.admissionSummary}
          onChange={(e) => update("admissionSummary", e.target.value)}
          placeholder="서류 100% 또는 서류+면접 등 전형 방법 요약"
        />
      </Field>
      <Field
        label="24-26년 입결 요약"
        full
        hint="**텍스트**로 감싸면 굵게 표시돼요. 예: **최초합** 최고/평균/최저"
      >
        <textarea
          className="input min-h-48 resize-y leading-relaxed"
          value={form.resultSummary}
          onChange={(e) => update("resultSummary", e.target.value)}
          placeholder="예: **최초합** 최고/평균/최저 1.07 / 1.33 / 1.49"
        />
      </Field>
      {error && (
        <p className="text-sm font-medium text-rose-500 sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "저장 중..." : editingCard ? "수정 완료" : "카드 등록"}
        </button>
        {editingCard && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-full px-4 py-2 text-sm font-semibold text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  full,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-medium text-black/80 dark:text-white/80">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && (
        <span className="text-xs text-black/40 dark:text-white/40">{hint}</span>
      )}
    </label>
  );
}
