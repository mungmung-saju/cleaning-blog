export const CLEANING_TYPES = [
  "입주청소",
  "이사청소",
  "거주청소",
  "정기청소",
  "상가청소",
  "에어컨청소",
  "특수청소",
] as const;

export type CleaningType = (typeof CLEANING_TYPES)[number];

/** 이미지에 붙일 수 있는 빠른 태그 프리셋 */
export const IMAGE_TAG_PRESETS = [
  "청소 전 주방",
  "청소 전 화장실",
  "기름때 제거 전",
  "약품 도포 및 스팀 작업",
  "줄눈 시공 후",
  "창틀 먼지 제거",
  "베란다 작업",
  "장비 작업 모습",
  "청소 후 주방",
  "청소 완료 전체 샷",
] as const;

export const LIMITS = {
  maxReferenceUrls: 3,
  maxImages: 20,
  maxKeywords: 10,
  maxKeywordLength: 30,
  maxLocationLength: 80,
  maxNotesLength: 1500,
  maxImageTextLength: 80,
} as const;

/** 서버로 전달되는 이미지 컨텍스트 (실제 파일은 전송하지 않음) */
export interface ImageContext {
  /** 1부터 시작하는 본문 내 사진 번호 */
  index: number;
  /** 태그(예: "청소 전 주방") */
  tag: string;
  /** 추가 메모 */
  memo: string;
}

export type KeywordMode = "auto" | "manual";

export interface GenerateBlogRequest {
  referenceUrls: string[];
  cleaningType: CleaningType;
  location: string;
  notes: string;
  keywordMode: KeywordMode;
  /** keywordMode === "manual" 일 때만 사용 */
  keywords: string[];
  images: ImageContext[];
}

export type KeywordStatus = "missing" | "low" | "ok" | "over";

export interface KeywordStat {
  keyword: string;
  count: number;
  status: KeywordStatus;
  /** 메인(지역+업종) 키워드 여부 */
  isMain?: boolean;
}

export interface ReferenceStatus {
  url: string;
  ok: boolean;
  title?: string;
  /** 실패 사유 */
  reason?: string;
}

export interface GenerateBlogResult {
  titles: string[];
  body: string;
  styleAnalysis: string;
  keywordStats: KeywordStat[];
  referenceStatus: ReferenceStatus[];
  /** 이미지 플레이스홀더 누락 등 사용자에게 알릴 경고 */
  warnings: string[];
  /** 공백 제외 본문 글자 수 */
  charCount: number;
}

export type GenerateStage = "reference" | "generate" | "verify";

export type StreamEvent =
  | { type: "stage"; stage: GenerateStage; message: string }
  | { type: "result"; data: GenerateBlogResult }
  | { type: "error"; message: string };

/** 클라이언트 전용: 업로드된 이미지 상태 */
export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  tag: string;
  memo: string;
}
