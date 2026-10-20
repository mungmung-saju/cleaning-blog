import type { ReferenceStatus } from "@/types/blog";

/**
 * 네이버 블로그 글 본문을 가져와 말투 분석용 텍스트로 변환합니다.
 *
 * SSRF 방지: 사용자가 준 URL을 그대로 fetch하지 않고,
 * blogId / logNo 만 추출해 blog.naver.com 의 PostView URL을 직접 조립합니다.
 */

export interface ReferenceSample {
  url: string;
  title: string;
  text: string;
}

const MAX_SAMPLE_CHARS = 2500;
const FETCH_TIMEOUT_MS = 8000;

export function parseNaverBlogUrl(raw: string): { blogId: string; logNo: string } | null {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase();
  if (host !== "blog.naver.com" && host !== "m.blog.naver.com") return null;

  let blogId = u.searchParams.get("blogId") ?? "";
  let logNo = u.searchParams.get("logNo") ?? "";

  if (!blogId || !logNo) {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
      blogId = blogId || parts[0];
      logNo = logNo || parts[1];
    } else if (parts.length === 1 && !blogId) {
      blogId = parts[0];
    }
  }

  if (!/^[A-Za-z0-9_-]{2,40}$/.test(blogId) || !/^\d{5,20}$/.test(logNo)) return null;
  return { blogId, logNo };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function stripTags(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\u200b/g, "")
  ).trim();
}

function extractText(html: string): { title: string; text: string } {
  const titleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ??
    html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : "";

  // 스마트에디터 ONE 문단
  const paragraphs: string[] = [];
  const re = /<p[^>]*class="[^"]*se-text-paragraph[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const t = stripTags(m[1]);
    if (t) paragraphs.push(t);
  }

  let text = paragraphs.join("\n");

  // 구형 에디터 등 fallback: 스크립트/스타일 제거 후 전체 텍스트
  if (text.length < 200) {
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");
    const area = cleaned.match(/id=["']postViewArea["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
    text = stripTags(area ? area[1] : cleaned)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n");
  }

  return { title, text: text.slice(0, MAX_SAMPLE_CHARS) };
}

/** 글 하나당 최대 대기 시간(뷰어 주소 + 모바일 주소 폴백 포함) */
const PER_LINK_BUDGET_MS = 8000;
/** 모든 링크를 합쳐 최대 대기 시간. 이 시간이 지나면 못 가져온 링크는 건너뜁니다. */
const TOTAL_BUDGET_MS = 10000;

class FetchFail extends Error {}

async function fetchHtml(url: string, timeoutMs: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new FetchFail("글을 불러오는 중 시간이 초과되었거나 연결에 실패했습니다.");
  }
  if (!res.ok) throw new FetchFail(`글을 불러오지 못했습니다 (HTTP ${res.status}).`);
  return res.text();
}

async function fetchOne(url: string): Promise<ReferenceSample> {
  const parsed = parseNaverBlogUrl(url);
  if (!parsed) {
    throw new FetchFail("네이버 블로그 글 주소(blog.naver.com/아이디/글번호) 형식이 아닙니다.");
  }
  const { blogId, logNo } = parsed;

  // 1순위: 본문만 담긴 뷰어 전용 주소 (iframe 없이 바로 본문 HTML)
  // 2순위: 모바일 글 주소 (1순위가 실패/빈 본문일 때만)
  const candidates = [
    `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`,
    `https://m.blog.naver.com/${blogId}/${logNo}`,
  ];

  const deadline = Date.now() + PER_LINK_BUDGET_MS;
  let lastError = "본문 텍스트를 추출하지 못했습니다 (비공개/삭제된 글일 수 있습니다).";

  for (const candidate of candidates) {
    const remaining = deadline - Date.now();
    if (remaining < 500) break;
    try {
      const html = await fetchHtml(candidate, Math.min(remaining, FETCH_TIMEOUT_MS));
      const { title, text } = extractText(html);
      if (text.length >= 80) return { url, title, text };
      lastError = "본문 텍스트를 추출하지 못했습니다 (비공개/삭제된 글일 수 있습니다).";
    } catch (e) {
      if (e instanceof FetchFail) lastError = e.message;
    }
  }
  throw new FetchFail(lastError);
}

/**
 * 모든 레퍼런스를 병렬로 수집합니다. 일부/전부 실패해도 예외를 던지지 않고,
 * 실패한 링크는 status 에 사유만 남기고 건너뜁니다. (호출부는 기본 톤으로 진행)
 */
export async function fetchReferences(
  urls: string[]
): Promise<{ samples: ReferenceSample[]; status: ReferenceStatus[] }> {
  // 링크별 결과를 개별 보관 → 전체 예산이 끝나도 이미 성공한 링크는 살립니다.
  const results: PromiseSettledResult<ReferenceSample>[] = [];
  const tasks = urls.map((u, i) =>
    fetchOne(u).then(
      (value) => void (results[i] = { status: "fulfilled", value }),
      (reason) => void (results[i] = { status: "rejected", reason })
    )
  );

  let timer: ReturnType<typeof setTimeout> | undefined;
  const totalTimeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, TOTAL_BUDGET_MS);
  });
  await Promise.race([Promise.allSettled(tasks), totalTimeout]);
  clearTimeout(timer);

  const samples: ReferenceSample[] = [];
  const status: ReferenceStatus[] = urls.map((url, i) => {
    const r = results[i];
    if (!r) return { url, ok: false, reason: "수집 시간이 초과되어 건너뛰었습니다." };
    if (r.status === "fulfilled") {
      samples.push(r.value);
      return { url, ok: true, title: r.value.title };
    }
    const reason =
      r.reason instanceof FetchFail ? r.reason.message : "글을 불러오는 중 오류가 발생했습니다.";
    return { url, ok: false, reason };
  });
  return { samples, status };
}
