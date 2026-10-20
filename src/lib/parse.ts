/**
 * 모델 응답 파서.
 *
 * JSON 은 본문 안의 줄바꿈/따옴표 이스케이프가 어긋나면 통째로 깨지고 모델마다 편차가 커서,
 * 섹션 구분자([[NAME]]) 방식으로 응답받습니다. 본문이 마지막 섹션이라 잘려도 최대한 살립니다.
 */

export interface ParsedModelOutput {
  styleAnalysis: string;
  mainKeyword: string;
  titles: string[];
  autoKeywords: string[];
  body: string;
}

const MARKER_RE = /^[ \t]*\[\[([A-Z_]+)\]\][ \t]*$/gm;

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```[a-zA-Z]*\s*\n/, "")
    .replace(/\n```\s*$/, "")
    .trim();
}

function cleanLine(s: string): string {
  return s
    .replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "") // 번호/불릿 제거
    .replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, "")
    .trim();
}

export function parseModelOutput(raw: string): ParsedModelOutput {
  const text = stripFences(raw);

  const sections: Record<string, string> = {};
  const markers = [...text.matchAll(MARKER_RE)];
  markers.forEach((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < markers.length ? (markers[i + 1].index ?? text.length) : text.length;
    sections[m[1]] = text.slice(start, end).trim();
  });

  // 모델이 "마크다운 금지" 지시를 어겨도 네이버 에디터에 깨진 기호가 붙지 않도록 정리
  const body = (sections.BODY ?? "")
    .replace(/\n?\[\[END\]\]\s*$/, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  if (!body) {
    console.error("[parse] BODY section missing. length =", raw.length, "head =", raw.slice(0, 200));
    throw new Error("AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.");
  }

  const titles = (sections.TITLES ?? "")
    .split("\n")
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 3);

  const autoKeywords = (sections.AUTO_KEYWORDS ?? "")
    .split(/[,\n]/)
    .map(cleanLine)
    .filter(Boolean);

  return {
    styleAnalysis: (sections.STYLE ?? "").trim(),
    mainKeyword: cleanLine((sections.MAIN_KEYWORD ?? "").split("\n")[0] ?? ""),
    titles,
    autoKeywords,
    body,
  };
}
