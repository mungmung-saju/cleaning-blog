"use client";

import { ClipboardList } from "lucide-react";
import { CLEANING_TYPES, LIMITS, type CleaningType } from "@/types/blog";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

interface Props {
  cleaningType: CleaningType;
  location: string;
  notes: string;
  onCleaningType: (v: CleaningType) => void;
  onLocation: (v: string) => void;
  onNotes: (v: string) => void;
}

export function BasicInfoForm({
  cleaningType,
  location,
  notes,
  onCleaningType,
  onLocation,
  onNotes,
}: Props) {
  return (
    <Section
      step={2}
      icon={ClipboardList}
      title="작업 기본 정보"
      description="글의 뼈대가 되는 현장 정보를 입력하세요."
    >
      <div className="space-y-4">
        <div>
          <span className="field-label">청소 종류</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="청소 종류">
            {CLEANING_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={cleaningType === t}
                onClick={() => onCleaningType(t)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  cleaningType === t
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-600"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="location" className="field-label">
            지역명 / 아파트명 / 현장명 <span className="text-rose-500">*</span>
          </label>
          <input
            id="location"
            value={location}
            maxLength={LIMITS.maxLocationLength}
            onChange={(e) => onLocation(e.target.value)}
            placeholder="예: 수원 영통구 힐스테이트 34평"
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="notes" className="field-label">
            주요 특이사항 / 시공 포인트
          </label>
          <textarea
            id="notes"
            rows={4}
            value={notes}
            maxLength={LIMITS.maxNotesLength}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="예: 주방 후드 기름때가 심했고, 욕실 줄눈 곰팡이 제거 후 줄눈 시공 진행. 반려견 있는 집이라 친환경 약품 사용."
            className="field-input resize-y"
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {notes.length}/{LIMITS.maxNotesLength}
          </p>
        </div>
      </div>
    </Section>
  );
}
