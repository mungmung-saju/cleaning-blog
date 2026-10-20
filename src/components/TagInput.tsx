"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { LIMITS } from "@/types/blog";

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/** 콤마(,) 또는 Enter로 태그를 추가하는 Multi-tag 입력 */
export function TagInput({ tags, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim().slice(0, LIMITS.maxKeywordLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...tags];
    for (const p of parts) {
      if (next.length >= LIMITS.maxKeywords) break;
      if (!next.some((t) => t.replace(/\s/g, "") === p.replace(/\s/g, ""))) next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter 이중 입력 방지
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const full = tags.length >= LIMITS.maxKeywords;

  return (
    <div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-50 py-1 pl-2.5 pr-1.5 text-sm font-medium text-emerald-700"
          >
            {t}
            <button
              type="button"
              aria-label={`${t} 삭제`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="rounded-full p-0.5 text-emerald-500 hover:bg-emerald-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          disabled={full}
          onChange={(e) => {
            const v = e.target.value;
            // 붙여넣기 등으로 콤마가 포함되면 즉시 분리
            if (v.includes(",")) commit(v);
            else setDraft(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          placeholder={full ? "최대 개수에 도달했어요" : tags.length ? "" : placeholder}
          aria-label="강조 키워드 입력"
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Enter 또는 콤마(,)로 추가 · {tags.length}/{LIMITS.maxKeywords}
      </p>
    </div>
  );
}
