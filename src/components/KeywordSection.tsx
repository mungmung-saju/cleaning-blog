"use client";

import { Hash, Sparkles } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Switch } from "@/components/ui/Switch";
import { TagInput } from "@/components/TagInput";

interface Props {
  manual: boolean;
  keywords: string[];
  onManual: (v: boolean) => void;
  onKeywords: (v: string[]) => void;
}

export function KeywordSection({ manual, keywords, onManual, onKeywords }: Props) {
  return (
    <Section
      step={3}
      icon={Hash}
      title="강조 키워드"
      description="네이버 검색 노출을 위해 본문에 녹일 키워드를 정합니다."
    >
      <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
        <label htmlFor="kw-toggle" className="cursor-pointer">
          <span className="block text-sm font-semibold text-slate-800">키워드 직접 지정 모드</span>
          <span className="block text-xs text-slate-500">
            {manual ? "ON · 입력한 키워드를 본문에 3~5회 분산 배치" : "OFF · AI가 연관/롱테일 키워드를 자동 선정"}
          </span>
        </label>
        <Switch id="kw-toggle" checked={manual} onChange={onManual} label="키워드 직접 지정 모드" />
      </div>

      {manual ? (
        <div className="mt-3">
          <TagInput tags={keywords} onChange={onKeywords} placeholder="예: 수원입주청소, 기름때제거, 줄눈시공" />
        </div>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
          지역명과 청소 종류를 바탕으로 AI가 롱테일 키워드 3~4개를 자동 추출해 자연스럽게 배치합니다.
        </p>
      )}
    </Section>
  );
}
