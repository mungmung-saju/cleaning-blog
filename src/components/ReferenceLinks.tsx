"use client";

import { Link2, Plus, X } from "lucide-react";
import { LIMITS } from "@/types/blog";
import { Section } from "@/components/ui/Section";

interface Props {
  urls: string[];
  onChange: (urls: string[]) => void;
}

const looksLikeNaverBlog = (u: string) =>
  !u.trim() || /^(https?:\/\/)?(m\.)?blog\.naver\.com\//i.test(u.trim());

export function ReferenceLinks({ urls, onChange }: Props) {
  const update = (i: number, v: string) => onChange(urls.map((u, idx) => (idx === i ? v : u)));
  const remove = (i: number) => onChange(urls.filter((_, idx) => idx !== i));
  const add = () => urls.length < LIMITS.maxReferenceUrls && onChange([...urls, ""]);

  return (
    <Section
      step={1}
      icon={Link2}
      title="레퍼런스 링크 (말투·스타일 분석)"
      description="닮고 싶은 네이버 블로그 글 주소를 최대 3개까지 입력하세요. 비워두면 기본 톤으로 작성합니다."
    >
      <div className="space-y-2">
        {urls.map((url, i) => {
          const invalid = !looksLikeNaverBlog(url);
          return (
            <div key={i}>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => update(i, e.target.value)}
                  placeholder="https://blog.naver.com/아이디/글번호"
                  aria-label={`레퍼런스 링크 ${i + 1}`}
                  className={`field-input ${invalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`레퍼런스 링크 ${i + 1} 삭제`}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {invalid && (
                <p className="mt-1 text-xs text-rose-500">
                  blog.naver.com 글 주소만 사용할 수 있어요.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {urls.length < LIMITS.maxReferenceUrls && (
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-600"
        >
          <Plus className="h-4 w-4" />
          링크 추가 ({urls.length}/{LIMITS.maxReferenceUrls})
        </button>
      )}
    </Section>
  );
}
