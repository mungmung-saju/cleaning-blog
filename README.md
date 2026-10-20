# 청소업체 네이버 블로그 자동 포스팅 생성기

Next.js 14 (App Router) + TypeScript + Tailwind CSS

## 실행

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# .env.local 에 AI_API_KEY / AI_BASE_URL / AI_MODEL_NAME 입력 (OpenAI SDK 호환 엔드포인트)
npm run dev
```

http://localhost:3000

## 폴더 구조

```
src/
├─ app/
│  ├─ api/generate-blog/route.ts   # 생성 API (NDJSON 진행상태 스트리밍)
│  ├─ layout.tsx · page.tsx · globals.css
├─ components/                     # ReferenceLinks, BasicInfoForm, KeywordSection, TagInput,
│                                  # ImageUploader, ResultPanel, LoadingState, ui/*
├─ hooks/                          # useBlogGenerator(스트림 소비), useCopy(클립보드)
├─ lib/
│  ├─ prompt.ts                    # System/User 프롬프트
│  ├─ llm.ts                       # OpenAI SDK(baseURL 주입) 호출
│  ├─ naver.ts                     # 네이버 블로그 본문 수집 (SSRF 방지)
│  ├─ keywords.ts                  # 키워드 빈도 집계 (서버에서 직접 계산)
│  ├─ format.ts                    # 본문 파서 / HTML 변환
│  └─ validate.ts                  # 요청 검증
└─ types/blog.ts
```

## 동작 메모

- 업로드한 사진 파일은 서버로 보내지 않고, 태그/메모 텍스트만 프롬프트에 사용합니다. 미리보기는 브라우저에서만 보여줍니다.
- 키워드 빈도는 AI의 자기 보고가 아니라 서버가 최종 본문에서 직접 세어(공백 무시) 칩으로 표시합니다.
- 이미지 `[📸 사진 N: …]` 누락 시 결과 상단에 경고가 표시됩니다.
- 레퍼런스 글을 못 불러와도(비공개/차단 등) 기본 톤으로 생성되며, 결과 패널에 상태가 표시됩니다.
- 인증이 없는 API라 외부에 배포할 때는 접근 제한/요청 제한(rate limit)을 추가하세요. (API 키 비용 보호)
