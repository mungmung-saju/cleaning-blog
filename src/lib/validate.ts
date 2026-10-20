import {
  CLEANING_TYPES,
  LIMITS,
  type CleaningType,
  type GenerateBlogRequest,
  type ImageContext,
} from "@/types/blog";

type Result =
  | { ok: true; data: GenerateBlogRequest }
  | { ok: false; error: string };

const str = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export function validateRequest(input: unknown): Result {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "잘못된 요청입니다." };
  }
  const b = input as Record<string, unknown>;

  const cleaningType = b.cleaningType as CleaningType;
  if (!CLEANING_TYPES.includes(cleaningType)) {
    return { ok: false, error: "청소 종류가 올바르지 않습니다." };
  }

  const location = str(b.location, LIMITS.maxLocationLength);
  if (!location) {
    return { ok: false, error: "지역명/아파트명/현장명을 입력해주세요." };
  }

  const referenceUrls = (Array.isArray(b.referenceUrls) ? b.referenceUrls : [])
    .map((u) => str(u, 300))
    .filter(Boolean)
    .slice(0, LIMITS.maxReferenceUrls);

  const keywordMode = b.keywordMode === "manual" ? "manual" : "auto";

  const keywords =
    keywordMode === "manual"
      ? Array.from(
          new Set(
            (Array.isArray(b.keywords) ? b.keywords : [])
              .map((k) => str(k, LIMITS.maxKeywordLength))
              .filter(Boolean)
          )
        ).slice(0, LIMITS.maxKeywords)
      : [];

  if (keywordMode === "manual" && keywords.length === 0) {
    return { ok: false, error: "직접 지정 모드에서는 키워드를 1개 이상 입력해주세요." };
  }

  const images: ImageContext[] = (Array.isArray(b.images) ? b.images : [])
    .slice(0, LIMITS.maxImages)
    .map((img, i) => {
      const o = (img ?? {}) as Record<string, unknown>;
      return {
        index: i + 1, // 클라이언트 값을 믿지 않고 순서로 재부여
        tag: str(o.tag, LIMITS.maxImageTextLength),
        memo: str(o.memo, LIMITS.maxImageTextLength),
      };
    });

  return {
    ok: true,
    data: {
      referenceUrls,
      cleaningType,
      location,
      notes: str(b.notes, LIMITS.maxNotesLength),
      keywordMode,
      keywords,
      images,
    },
  };
}
