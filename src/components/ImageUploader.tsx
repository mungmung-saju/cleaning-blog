"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { IMAGE_TAG_PRESETS, LIMITS, type UploadedImage } from "@/types/blog";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

interface Props {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

export function ImageUploader({ images, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");

  // 언마운트 시 생성한 미리보기 URL 정리 (결과 미리보기에서도 쓰므로 제거 시점엔 해제하지 않음)
  const createdUrls = useRef<string[]>([]);
  useEffect(() => () => createdUrls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // onChange 클로저가 오래된 images를 잡지 않도록 ref 사용
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      const current = imagesRef.current;
      const room = LIMITS.maxImages - current.length;
      const accepted = files.slice(0, Math.max(room, 0));

      setNotice(
        files.length === 0
          ? "이미지 파일만 업로드할 수 있어요."
          : files.length > accepted.length
            ? `최대 ${LIMITS.maxImages}장까지 업로드할 수 있어요.`
            : ""
      );
      if (!accepted.length) return;

      const added: UploadedImage[] = accepted.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        createdUrls.current.push(previewUrl);
        return { id: crypto.randomUUID(), file, previewUrl, tag: "", memo: "" };
      });
      onChange([...current, ...added]);
    },
    [onChange]
  );

  const patch = (id: string, p: Partial<UploadedImage>) =>
    onChange(images.map((img) => (img.id === id ? { ...img, ...p } : img)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Section
      step={4}
      icon={ImagePlus}
      title="이미지 업로드 및 배치"
      description="사진 순서대로 본문에 [📸 사진 N: …] 배치 가이드가 생성됩니다. 사진 파일은 서버로 전송되지 않아요."
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="이미지 업로드 영역"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50"
        )}
      >
        <UploadCloud className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-semibold text-slate-700">
          사진을 끌어다 놓거나 클릭해서 선택하세요
        </p>
        <p className="text-xs text-slate-400">
          {images.length}/{LIMITS.maxImages}장 · 여러 장 동시 선택 가능
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {notice && <p className="mt-2 text-xs text-rose-500">{notice}</p>}

      {images.length > 0 && (
        <ul className="mt-4 space-y-3">
          {images.map((img, i) => (
            <li key={img.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`사진 ${i + 1} 미리보기`}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      📸 사진 {i + 1}
                    </span>
                    <div className="flex items-center">
                      <IconBtn label="위로 이동" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="아래로 이동"
                        disabled={i === images.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="삭제"
                        danger
                        onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconBtn>
                    </div>
                  </div>
                  <input
                    value={img.memo}
                    maxLength={LIMITS.maxImageTextLength}
                    onChange={(e) => patch(img.id, { memo: e.target.value })}
                    placeholder="메모 (예: 후드 기름때가 심한 상태)"
                    aria-label={`사진 ${i + 1} 메모`}
                    className="field-input !py-1.5"
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {IMAGE_TAG_PRESETS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => patch(img.id, { tag: img.tag === tag ? "" : tag })}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                      img.tag === tag
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-slate-400 disabled:cursor-not-allowed disabled:opacity-30",
        danger ? "hover:bg-rose-50 hover:text-rose-500" : "hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}
