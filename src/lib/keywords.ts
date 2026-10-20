import type { KeywordMode, KeywordStat, KeywordStatus } from "@/types/blog";

const normalize = (s: string) => s.replace(/\s+/g, "");

/** 공백을 무시하고 겹치지 않게 키워드 등장 횟수를 셉니다. ("수원 입주청소" == "수원입주청소") */
export function countKeyword(body: string, keyword: string): number {
  const b = normalize(body);
  const k = normalize(keyword);
  if (!k) return 0;
  let count = 0;
  let i = 0;
  while ((i = b.indexOf(k, i)) !== -1) {
    count++;
    i += k.length;
  }
  return count;
}

const MAX_RECOMMENDED = 7; // 이를 넘으면 키워드 스터핑 위험

export function buildKeywordStats(
  body: string,
  mainKeyword: string | undefined,
  keywords: string[],
  mode: KeywordMode
): KeywordStat[] {
  const minCount = mode === "manual" ? 3 : 1;
  const seen = new Set<string>();
  const list: { keyword: string; isMain: boolean }[] = [];

  const push = (kw: string, isMain: boolean) => {
    const key = normalize(kw);
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push({ keyword: kw.trim(), isMain });
  };

  if (mainKeyword) push(mainKeyword, true);
  keywords.forEach((k) => push(k, false));

  return list.map(({ keyword, isMain }) => {
    const count = countKeyword(body, keyword);
    let status: KeywordStatus = "ok";
    if (count === 0) status = "missing";
    else if (count < minCount) status = "low";
    else if (count > MAX_RECOMMENDED) status = "over";
    return { keyword, count, status, isMain };
  });
}
