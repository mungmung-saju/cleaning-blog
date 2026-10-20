"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  FileText,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { GenerateBlogResult, KeywordStatus, UploadedImage } from "@/types/blog";
import { bodyToHtml, parseBody } from "@/lib/format";
import { useCopy } from "@/hooks/useCopy";
import { cn } from "@/lib/utils";

interface Props {
  result: GenerateBlogResult;
  /** 생성 시점의 이미지 스냅샷 (미리보기 썸네일용) */
  images: UploadedImage[];
}

const CHIP_STYLE: Record<KeywordStatus, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-700",
  low: "border-amber-200 bg-amber-50 text-amber-700",
  missing: "border-rose-200 bg-rose-50 text-rose-700",
  over: "border-orange-200 bg-orange-50 text-orange-700",
};

const CHIP_HINT: Record<KeywordStatus, string> = {
  ok: "적정",
  low: "사용 횟수 부족",
  missing: "본문에 없음",
  over: "과다 사용 (스터핑 위험)",
};

export function ResultPanel({ result, images }: Props) {
  const { copiedKey, copyText, copyHtml } = useCopy();
  const blocks = useMemo(() => parseBody(result.body), [result.body]);

  return (
    <div className="space-y-6">
      {/* 경고 */}
      {result.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="mb-1 flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-4 w-4" /> 확인이 필요해요
          </p>
          <ul className="list-disc space-y-0.5 pl-5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 제목 추천 */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-slate-900">추천 제목 {result.titles.length}가지</h3>
        <ul className="space-y-2">
          {result.titles.map((t, i) => {
            const len = [...t].length;
            const good = len >= 25 && len <= 35;
            return (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-keep text-sm font-semibold text-slate-900">{t}</p>
                  <p className={cn("mt-0.5 text-xs", good ? "text-emerald-600" : "text-slate-400")}>
                    {len}자 {good ? "· 권장 길이(25~35자)" : "· 권장 25~35자"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(`title-${i}`, t)}
                  aria-label={`제목 ${i + 1} 복사`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                >
                  {copiedKey === `title-${i}` ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 키워드 빈도 */}
      {result.keywordStats.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-slate-900">키워드 사용 빈도</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywordStats.map((k) => (
              <span
                key={k.keyword}
                title={CHIP_HINT[k.status]}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                  CHIP_STYLE[k.status]
                )}
              >
                {k.isMain && <Sparkles className="h-3 w-3" />}
                {k.keyword} {k.count}회
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            공백을 무시하고 집계 · 초록=적정 / 노랑=부족 / 빨강=없음 / 주황=과다
          </p>
        </div>
      )}

      {/* 분석 정보 */}
      {(result.styleAnalysis || result.referenceStatus.length > 0) && (
        <details className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">말투 분석 · 레퍼런스 결과</summary>
          {result.styleAnalysis && <p className="mt-2 leading-relaxed">{result.styleAnalysis}</p>}
          <ul className="mt-2 space-y-1">
            {result.referenceStatus.map((r) => (
              <li key={r.url} className="flex items-start gap-1.5">
                {r.ok ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                )}
                <span className="break-all">
                  {r.ok ? r.title || r.url : `${r.url} — ${r.reason}`}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* 본문 */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">
            본문 미리보기{" "}
            <span className="ml-1 text-xs font-normal text-slate-400">
              공백 제외 {result.charCount.toLocaleString()}자
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyText("body", result.body)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {copiedKey === "body" ? <Check className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              {copiedKey === "body" ? "복사됨!" : "텍스트 복사"}
            </button>
            <button
              type="button"
              onClick={() => copyHtml("html", bodyToHtml(result.body))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
            >
              {copiedKey === "html" ? <Check className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
              {copiedKey === "html" ? "복사됨!" : "HTML 복사"}
            </button>
          </div>
        </div>

        <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          {blocks.map((b, i) => {
            switch (b.type) {
              case "heading":
                return (
                  <h4 key={i} className="mb-2 mt-6 break-keep text-base font-bold text-slate-900 first:mt-0">
                    ■ {b.text}
                  </h4>
                );
              case "divider":
                return <hr key={i} className="my-5 border-slate-200" />;
              case "image": {
                const img = images[b.index - 1];
                return (
                  <figure
                    key={i}
                    className="my-4 overflow-hidden rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60"
                  >
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img.previewUrl}
                        alt={b.caption}
                        className="max-h-64 w-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    )}
                    <figcaption className="px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                      [📸 사진 {b.index}
                      {b.caption ? `: ${b.caption}` : ""}]
                    </figcaption>
                  </figure>
                );
              }
              case "paragraph":
                return (
                  <p key={i} className="mb-3 break-keep text-sm leading-7 text-slate-700">
                    {b.lines.map((line, j) => (
                      <span key={j}>
                        {j > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </p>
                );
            }
          })}
        </article>
      </div>
    </div>
  );
}
