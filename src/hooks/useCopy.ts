"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** 클립보드 복사 + 일정 시간 "복사됨" 상태 표시 */
export function useCopy(resetMs = 1800) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const mark = (key: string) => {
    setCopiedKey(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedKey(null), resetMs);
  };

  const copyText = useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    mark(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** text/html(서식 유지 붙여넣기) + text/plain(HTML 소스) 동시 복사 */
  const copyHtml = useCallback(
    async (key: string, html: string) => {
      try {
        if (typeof ClipboardItem === "undefined") throw new Error("no ClipboardItem");
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([html], { type: "text/plain" }),
          }),
        ]);
        mark(key);
      } catch {
        await copyText(key, html);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copyText]
  );

  return { copiedKey, copyText, copyHtml };
}
