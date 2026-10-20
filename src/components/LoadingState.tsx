import { Check, Loader2 } from "lucide-react";
import type { GenerateStage } from "@/types/blog";
import { cn } from "@/lib/utils";

const STEPS: { key: GenerateStage; label: string }[] = [
  { key: "reference", label: "레퍼런스 말투 샘플 수집" },
  { key: "generate", label: "스타일 분석 및 본문 작성" },
  { key: "verify", label: "SEO 키워드 최적화 검증" },
];

export function LoadingState({ stage, message }: { stage: GenerateStage | null; message: string }) {
  const current = STEPS.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-5" aria-live="polite" aria-busy="true">
      <div className="rounded-xl bg-emerald-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <Loader2 className="h-4 w-4 animate-spin" />
          {message}
        </p>
        <ol className="mt-3 space-y-1.5">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              className={cn(
                "flex items-center gap-2 text-xs",
                i < current ? "text-emerald-700" : i === current ? "font-semibold text-emerald-900" : "text-slate-400"
              )}
            >
              {i < current ? (
                <Check className="h-3.5 w-3.5" />
              ) : i === current ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
              )}
              {s.label}
            </li>
          ))}
        </ol>
      </div>

      <div className="animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100" />
          ))}
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-11/12 rounded bg-slate-100" />
          <div className="h-32 w-full rounded-lg bg-slate-100" />
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-4/5 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
