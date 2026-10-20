import OpenAI from "openai";

/**
 * OpenAI SDK 규격으로 중계 프록시(AIApiFlow 등)를 호출합니다.
 * 환경 변수: AI_API_KEY, AI_BASE_URL, AI_MODEL_NAME
 */

export class LLMConfigError extends Error {}

const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";
// 한 번의 모델 호출 최대 대기 시간. route.ts 의 maxDuration(120초)보다 충분히 짧게 유지합니다.
const TIMEOUT_MS = 90_000;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.AI_API_KEY) {
    throw new LLMConfigError(
      "서버에 AI_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하고 개발 서버를 재시작해주세요."
    );
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL,
      timeout: TIMEOUT_MS,
      // 재시도하면 대기 시간이 2배가 되어 오히려 타임아웃을 유발하므로 끕니다.
      maxRetries: 0,
    });
  }
  return client;
}

/** 모델이 생성한 원문 텍스트를 반환 */
export async function callLLM(system: string, user: string): Promise<string> {
  const openai = getClient();

  try {
    // 일부 중계 프록시/Claude 모델은 response_format 을 지원하지 않을 수 있어
    // 프롬프트의 구분자 형식으로 출력받고 lib/parse.ts 에서 파싱합니다.
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL_NAME || DEFAULT_MODEL,
      // 최신 모델 중에는 temperature 커스텀을 막는 경우가 있어 기본값을 사용합니다.
      max_tokens: 4096,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const choice = completion.choices?.[0];
    const content = choice?.message?.content;
    if (choice?.finish_reason && choice.finish_reason !== "stop") {
      console.warn("[llm] finish_reason =", choice.finish_reason, "usage =", JSON.stringify(completion.usage));
    }
    if (!content) throw new Error("AI 응답이 비어 있습니다.");
    return content;
  } catch (e) {
    if (e instanceof OpenAI.APIConnectionTimeoutError) {
      throw new Error("AI 응답 시간이 초과되었어요. 잠시 후 다시 시도해주세요.");
    }
    if (e instanceof OpenAI.APIError) {
      console.error("[llm] API error", e.status, e.message);
      if (e.status === 401 || e.status === 403) {
        throw new Error("AI API 인증에 실패했습니다. AI_API_KEY 를 확인해주세요.");
      }
      if (e.status === 429) {
        throw new Error("AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
      }
      throw new Error(`AI API 호출에 실패했습니다 (HTTP ${e.status ?? "?"}).`);
    }
    throw e;
  }
}