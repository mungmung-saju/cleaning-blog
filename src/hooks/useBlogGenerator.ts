"use client";

import { useCallback, useRef, useState } from "react";
import type {
  GenerateBlogRequest,
  GenerateBlogResult,
  GenerateStage,
  StreamEvent,
} from "@/types/blog";

type Status = "idle" | "loading" | "done" | "error";

const CLIENT_TIMEOUT_MS = 150_000;

export function useBlogGenerator() {
  const [status, setStatus] = useState<Status>("idle");
  const [stage, setStage] = useState<GenerateStage | null>(null);
  const [stageMessage, setStageMessage] = useState("");
  const [result, setResult] = useState<GenerateBlogResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (payload: GenerateBlogRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 서버(최대 120초)보다 길게 잡은 클라이언트 전체 타임아웃
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);

    setStatus("loading");
    setStage("reference");
    setStageMessage("요청 전송 중...");
    setError(null);

    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `요청에 실패했습니다 (HTTP ${res.status}).`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const handle = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as StreamEvent;
        if (event.type === "stage") {
          setStage(event.stage);
          setStageMessage(event.message);
        } else if (event.type === "result") {
          finished = true;
          setResult(event.data);
          setStatus("done");
        } else if (event.type === "error") {
          finished = true;
          setError(event.message);
          setStatus("error");
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach(handle);
      }
      handle(buffer);

      if (!finished) throw new Error("서버 응답이 중간에 끊겼습니다. 다시 시도해주세요.");
    } catch (e) {
      if (timedOut) {
        setError("응답이 너무 오래 걸려 중단했어요. 잠시 후 다시 시도해주세요.");
        setStatus("error");
        return;
      }
      if (controller.signal.aborted) return; // 사용자가 취소/재요청
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.");
      setStatus("error");
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
  }, []);

  return { status, stage, stageMessage, result, error, generate, cancel };
}
