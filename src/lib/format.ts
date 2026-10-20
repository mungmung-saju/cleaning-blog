/**
 * 생성된 본문 텍스트 파서/변환기 (서버·클라이언트 공용).
 * 서식 규약은 src/lib/prompt.ts 와 동일: "■ 소제목", "━━━ 구분선", "[📸 사진 N: 설명]"
 */

export type BodyBlock =
  | { type: "heading"; text: string }
  | { type: "divider" }
  | { type: "image"; index: number; caption: string }
  | { type: "paragraph"; lines: string[] };

const IMAGE_RE = /^\[\s*📸\s*사진\s*(\d+)\s*[:：]?\s*(.*?)\s*\]$/u;
const DIVIDER_RE = /^[━─—=\-_*~]{5,}$/u;
const HEADING_RE = /^■\s*(.+?)\s*■?$/u;

export function parseBody(body: string): BodyBlock[] {
  const blocks: BodyBlock[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length) {
      blocks.push({ type: "paragraph", lines: current });
      current = [];
    }
  };

  for (const rawLine of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const img = line.match(IMAGE_RE);
    if (img) {
      flush();
      blocks.push({ type: "image", index: Number(img[1]), caption: img[2] });
      continue;
    }
    if (DIVIDER_RE.test(line)) {
      flush();
      blocks.push({ type: "divider" });
      continue;
    }
    const h = line.match(HEADING_RE);
    if (h) {
      flush();
      blocks.push({ type: "heading", text: h[1] });
      continue;
    }
    current.push(line);
  }
  flush();
  return blocks;
}

/** 본문에서 누락된 사진 번호(1..count)를 반환 */
export function findMissingImages(body: string, count: number): number[] {
  const found = new Set(
    parseBody(body)
      .filter((b): b is Extract<BodyBlock, { type: "image" }> => b.type === "image")
      .map((b) => b.index)
  );
  const missing: number[] = [];
  for (let i = 1; i <= count; i++) if (!found.has(i)) missing.push(i);
  return missing;
}

export function countChars(body: string): number {
  return body.replace(/\s+/g, "").length;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** 네이버 에디터 붙여넣기용 HTML. 이미지는 자리표시 박스로 출력합니다. */
export function bodyToHtml(body: string): string {
  const out: string[] = [];
  for (const b of parseBody(body)) {
    switch (b.type) {
      case "heading":
        out.push(`<h3 style="margin:24px 0 8px;font-size:18px;">${esc(b.text)}</h3>`);
        break;
      case "divider":
        out.push(`<hr style="margin:24px 0;border:0;border-top:1px solid #cbd5e1;" />`);
        break;
      case "image":
        out.push(
          `<p style="margin:16px 0;padding:12px;background:#f1f5f9;border:1px dashed #94a3b8;text-align:center;color:#475569;">[📸 사진 ${b.index}${
            b.caption ? `: ${esc(b.caption)}` : ""
          }]</p>`
        );
        break;
      case "paragraph":
        out.push(`<p style="margin:0 0 14px;line-height:1.8;">${b.lines.map(esc).join("<br />")}</p>`);
        break;
    }
  }
  return out.join("\n");
}
