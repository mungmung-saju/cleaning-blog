"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, FileSearch, Loader2, SprayCan, Wand2 } from "lucide-react";
import {
  type CleaningType,
  type GenerateBlogRequest,
  type UploadedImage,
} from "@/types/blog";
import { ReferenceLinks } from "@/components/ReferenceLinks";
import { BasicInfoForm } from "@/components/BasicInfoForm";
import { KeywordSection } from "@/components/KeywordSection";
import { ImageUploader } from "@/components/ImageUploader";
import { ResultPanel } from "@/components/ResultPanel";
import { LoadingState } from "@/components/LoadingState";
import { useBlogGenerator } from "@/hooks/useBlogGenerator";

export default function HomePage() {
  const [referenceUrls, setReferenceUrls] = useState<string[]>([""]);
  const [cleaningType, setCleaningType] = useState<CleaningType>("입주청소");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [manualKeywords, setManualKeywords] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [snapshotImages, setSnapshotImages] = useState<UploadedImage[]>([]);
  const [formError, setFormError] = useState("");

  const { status, stage, stageMessage, result, error, generate, cancel } = useBlogGenerator();
  const resultRef = useRef<HTMLDivElement>(null);
  const loading = status === "loading";

  // 모바일(1열)에서는 생성 시작/완료 시 결과 영역으로 스크롤
  useEffect(() => {
    if ((status === "loading" || status === "done") && window.innerWidth < 1024) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!location.trim()) {
      setFormError("지역명/아파트명/현장명을 입력해주세요.");
      return;
    }
    if (manualKeywords && keywords.length === 0) {
      setFormError("키워드 직접 지정 모드에서는 키워드를 1개 이상 입력해주세요.");
      return;
    }
    setFormError("");

    const payload: GenerateBlogRequest = {
      referenceUrls: referenceUrls.map((u) => u.trim()).filter(Boolean),
      cleaningType,
      location: location.trim(),
      notes: notes.trim(),
      keywordMode: manualKeywords ? "manual" : "auto",
      keywords: manualKeywords ? keywords : [],
      images: images.map((img, i) => ({ index: i + 1, tag: img.tag, memo: img.memo })),
    };
    setSnapshotImages(images);
    generate(payload);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <SprayCan className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">청소 블로그 AI 포스팅 생성기</h1>
            <p className="text-xs text-slate-500">말투 복제 · 네이버 SEO · 이미지 배치 가이드를 한 번에</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:items-start">
        {/* 좌측: 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <ReferenceLinks urls={referenceUrls} onChange={setReferenceUrls} />
          <BasicInfoForm
            cleaningType={cleaningType}
            location={location}
            notes={notes}
            onCleaningType={setCleaningType}
            onLocation={setLocation}
            onNotes={setNotes}
          />
          <KeywordSection
            manual={manualKeywords}
            keywords={keywords}
            onManual={setManualKeywords}
            onKeywords={setKeywords}
          />
          <ImageUploader images={images} onChange={setImages} />

          <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            {formError && (
              <p className="mb-2 flex items-center gap-1.5 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? "생성 중..." : result ? "다시 생성하기" : "블로그 글 생성하기"}
              </button>
              {loading && (
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </form>

        {/* 우측: 결과 */}
        <aside
          ref={resultRef}
          className="card scroll-mt-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
          aria-label="생성 결과"
        >
          <h2 className="mb-4 text-base font-bold text-slate-900">생성 결과</h2>

          {loading ? (
            <LoadingState stage={stage} message={stageMessage} />
          ) : status === "error" ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <AlertCircle className="h-4 w-4" /> 생성에 실패했어요
              </p>
              <p>{error}</p>
            </div>
          ) : result ? (
            <ResultPanel result={result} images={snapshotImages} />
          ) : (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-slate-400">
              <FileSearch className="h-10 w-10" />
              <p className="text-sm font-medium text-slate-500">아직 생성된 글이 없어요</p>
              <p className="text-xs">왼쪽 정보를 입력하고 &lsquo;블로그 글 생성하기&rsquo;를 눌러보세요.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
