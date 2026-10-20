import { NextRequest } from "next/server";
import { fetchReferences } from "@/lib/naver";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { callLLM, LLMConfigError } from "@/lib/llm";
import { parseModelOutput } from "@/lib/parse";
import { buildKeywordStats } from "@/lib/keywords";
import { countChars, findMissingImages } from "@/lib/format";
import { validateRequest } from "@/lib/validate";
import type { GenerateBlogResult, StreamEvent } from "@/types/blog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 모델 호출 타임아웃(90초) + 레퍼런스 수집(최대 ~10초)을 포함할 수 있도록 120초로 설정
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  const validated = validateRequest(payload);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }
  const input = validated.data;

  // 진행 상태를 NDJSON(줄바꿈 구분 JSON)으로 스트리밍
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      try {
        // 1) 레퍼런스 수집
        send({
          type: "stage",
          stage: "reference",
          message: input.referenceUrls.length
            ? "레퍼런스 글에서 말투 샘플 수집 중..."
            : "레퍼런스 없이 기본 톤으로 준비 중...",
        });
        const { samples, status } = input.referenceUrls.length
          ? await fetchReferences(input.referenceUrls)
          : { samples: [], status: [] };

        // 2) LLM 호출
        send({ type: "stage", stage: "generate", message: "스타일 분석 및 본문 작성 중..." });
        const raw = await callLLM(buildSystemPrompt(), buildUserPrompt(input, samples));
        const out = parseModelOutput(raw);

        // 3) 검증/후처리
        send({ type: "stage", stage: "verify", message: "SEO 키워드 최적화 검증 중..." });

        const { body, titles } = out;
        if (titles.length === 0) {
          throw new Error("AI가 제목을 생성하지 못했습니다. 다시 시도해주세요.");
        }

        const mainKeyword = out.mainKeyword || undefined;
        const keywordList = input.keywordMode === "manual" ? input.keywords : out.autoKeywords;

        const warnings: string[] = [];
        const missing = findMissingImages(body, input.images.length);
        if (missing.length) {
          warnings.push(
            `다음 사진의 배치 가이드가 본문에 없습니다: ${missing.map((n) => `사진 ${n}`).join(", ")}. 다시 생성하거나 직접 추가해주세요.`
          );
        }
        if (titles.length < 3) warnings.push("제목이 3개 미만으로 생성되었습니다.");
        if (input.referenceUrls.length && samples.length === 0) {
          warnings.push("레퍼런스 글을 하나도 불러오지 못해 기본 톤으로 작성되었습니다.");
        }

        const keywordStats = buildKeywordStats(body, mainKeyword, keywordList, input.keywordMode);
        for (const k of keywordStats) {
          if (k.status === "over") warnings.push(`'${k.keyword}' 키워드가 ${k.count}회로 많습니다. 일부 줄여주세요.`);
          if (input.keywordMode === "manual" && k.status !== "ok" && !k.isMain && k.status !== "over") {
            warnings.push(`지정 키워드 '${k.keyword}' 가 ${k.count}회만 사용되었습니다 (권장 3~5회).`);
          }
        }

        const result: GenerateBlogResult = {
          titles,
          body,
          styleAnalysis: out.styleAnalysis,
          keywordStats,
          referenceStatus: status,
          warnings,
          charCount: countChars(body),
        };
        send({ type: "result", data: result });
      } catch (e) {
        const isTimeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
        const message = isTimeout
          ? "AI 응답 시간이 초과되었어요. 잠시 후 다시 시도해주세요."
          : e instanceof LLMConfigError || e instanceof Error
            ? e.message
            : "알 수 없는 오류가 발생했습니다.";
        console.error("[generate-blog]", e);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
