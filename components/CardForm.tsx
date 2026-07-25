"use client";

import { useState, type FormEvent } from "react";
import { getAutoHex, HEXES } from "@/lib/cardColor";
import type { NewUniversityCard, UniversityCard } from "@/lib/types";
import { useUniversityColors } from "@/lib/universityColors";

const emptyForm: NewUniversityCard = {
  universityName: "",
  department: "",
  admissionType: "",
  capacity: "",
  admissionSummary: "",
  resultSummary: "",
};

export default function CardForm({
  editingCard,
  onAdd,
  onUpdate,
  onCancelEdit,
}: {
  editingCard?: UniversityCard | null;
  onAdd: (card: NewUniversityCard) => void;
  onUpdate?: (id: string, card: NewUniversityCard) => void;
  onCancelEdit?: () => void;
}) {
  const [form, setForm] = useState<NewUniversityCard>(() =>
    editingCard
      ? {
          universityName: editingCard.universityName,
          department: editingCard.department,
          admissionType: editingCard.admissionType,
          capacity: editingCard.capacity,
          admissionSummary: editingCard.admissionSummary,
          resultSummary: editingCard.resultSummary,
        }
      : emptyForm,
  );
  const { colors, setUniversityColor } = useUniversityColors();

  const universityKey = form.universityName.trim();
  const customColor = universityKey ? colors[universityKey] : undefined;
  const swatchColor = customColor || getAutoHex(form.universityName);

  function update<K extends keyof NewUniversityCard>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.universityName.trim() || !form.department.trim()) return;
    if (editingCard && onUpdate) {
      onUpdate(editingCard.id, form);
    } else {
      onAdd(form);
      setForm(emptyForm);
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
          className="input min-h-20 resize-y"
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
      <div className="flex gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary w-full sm:w-auto">
          {editingCard ? "수정 완료" : "카드 등록"}
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
