"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StreamChunk = {
  id: string;
  score: string;
  content: string;
};

export type StreamCitation = {
  chunkId: string;
  documentId: string;
  sourcePath: string;
  score: number;
  snippet: string;
};

export type SearchStreamState = {
  stage: string;
  chunks: StreamChunk[];
  answer: string | null;
  citations: StreamCitation[];
  latencyMs: number | null;
  loading: boolean;
  error: string | null;
};

const initialState: SearchStreamState = {
  stage: "",
  chunks: [],
  answer: null,
  citations: [],
  latencyMs: null,
  loading: false,
  error: null
};

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4300";
}

export function useSearchStream(
  query: string,
  tenantId = "demo",
  topK = 5
): SearchStreamState {
  const [state, setState] = useState<SearchStreamState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (query.trim().length < 3) {
      setState(initialState);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...initialState, loading: true });

    try {
      const response = await fetch(`${getApiBaseUrl()}/v1/search/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, query, topK }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        setState((prev) => ({ ...prev, loading: false, error: "stream_request_failed" }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        // Keep the last (potentially incomplete) block in buffer
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          if (!block.trim()) continue;

          let eventName = "message";
          let dataLine = "";

          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) {
              eventName = line.slice("event:".length).trim();
            } else if (line.startsWith("data:")) {
              dataLine = line.slice("data:".length).trim();
            }
          }

          if (!dataLine) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(dataLine);
          } catch {
            continue;
          }

          switch (eventName) {
            case "status": {
              const s = parsed as { stage: string };
              setState((prev) => ({ ...prev, stage: s.stage }));
              break;
            }
            case "chunks": {
              const c = parsed as StreamChunk[];
              setState((prev) => ({ ...prev, chunks: c }));
              break;
            }
            case "answer": {
              const a = parsed as { answer: string | null; citations: StreamCitation[] };
              setState((prev) => ({ ...prev, answer: a.answer, citations: a.citations }));
              break;
            }
            case "done": {
              const d = parsed as { latencyMs: number };
              setState((prev) => ({ ...prev, latencyMs: d.latencyMs, loading: false }));
              break;
            }
            case "error": {
              const e = parsed as { message: string };
              setState((prev) => ({ ...prev, error: e.message, loading: false }));
              break;
            }
          }
        }
      }

      setState((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "unknown_error"
      }));
    }
  }, [query, tenantId, topK]);

  useEffect(() => {
    void run();
    return () => {
      abortRef.current?.abort();
    };
  }, [run]);

  return state;
}
