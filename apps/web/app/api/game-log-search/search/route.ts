import "server-only";

import {
  GameLogSearchCancelAckSchema,
  GameLogSearchCancelRequestSchema,
  GameLogSearchFrameSchema,
  GameLogSearchRequestSchema,
  type GameLogEvidence,
  type GameLogSearchFrame,
  type GameLogSearchRequest
} from "@funqa/contracts";

import {
  FIRST_BYTE_TIMEOUT_MS,
  NDJSON_CONTENT_TYPE,
  createRetrievalUnavailableTerminal,
  createSynthesisUnavailableTerminal,
  getGameLogSearchServiceUrl,
  ndjsonResponse
} from "@/app/api/game-log-search/_shared";
import {
  cancelGenkitRun,
  resolveGameLogSearchEngine,
  runGenkitSearch
} from "@/app/api/game-log-search/_genkit-engine";

export const dynamic = "force-dynamic";

class FrameOrderGuard {
  private phase: "start" | "accepted" | "retrieving" | "ranking" | "evidence" | "synthesizing" | "done" = "start";

  constructor(private readonly request: GameLogSearchRequest) {}

  accept(frame: GameLogSearchFrame): void {
    if (frame.query_id !== this.request.query_id || frame.correlation_id !== this.request.correlation_id) {
      throw new Error("frame_identity_mismatch");
    }

    if (frame.frame_type === "dispatch_accepted") {
      if (this.phase !== "start" || frame.parent_query_id !== this.request.parent_query_id) {
        throw new Error("dispatch_order_mismatch");
      }
      this.phase = "accepted";
      return;
    }

    if (this.phase === "start" || this.phase === "done") {
      throw new Error("frame_order_mismatch");
    }

    if (frame.frame_type === "stage") {
      const expected =
        this.phase === "accepted"
          ? "retrieving"
          : this.phase === "retrieving"
            ? "ranking"
            : this.phase === "evidence"
              ? "synthesizing"
              : null;
      if (frame.stage !== expected) {
        throw new Error("stage_order_mismatch");
      }
      this.phase = frame.stage;
      return;
    }

    if (frame.frame_type === "evidence_snapshot") {
      if (this.phase !== "ranking") {
        throw new Error("evidence_order_mismatch");
      }
      this.phase = "evidence";
      return;
    }

    if (frame.frame_type === "terminal") {
      if (frame.parent_query_id !== this.request.parent_query_id || frame.query_text !== this.request.query_text) {
        throw new Error("terminal_identity_mismatch");
      }
      const terminalOrderValid =
        (frame.outcome === "supported" || frame.outcome === "weak_support")
          ? this.phase === "synthesizing"
          : frame.outcome === "synthesis_unavailable"
            ? this.phase === "evidence" || this.phase === "synthesizing"
            : frame.outcome === "no_hits"
              ? this.phase === "ranking"
              : frame.outcome === "stale_index"
                ? this.phase === "ranking" || this.phase === "evidence"
                : this.phase === "accepted" || this.phase === "retrieving" || this.phase === "ranking" || this.phase === "evidence";
      if (!terminalOrderValid) {
        throw new Error("terminal_order_mismatch");
      }
      this.phase = "done";
      return;
    }

    this.phase = "done";
  }

  isDone(): boolean {
    return this.phase === "done";
  }
}

function parseFrame(line: string): GameLogSearchFrame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    throw new Error("malformed_ndjson");
  }
  return GameLogSearchFrameSchema.parse(parsed);
}

function idsMatchEvidence(
  evidence: readonly GameLogEvidence[],
  request: GameLogSearchRequest
): boolean {
  return evidence.every(
    (item) => item.query_id === request.query_id && item.correlation_id === request.correlation_id
  );
}

export async function POST(request: Request): Promise<Response> {
  let requestPayload: unknown;
  try {
    requestPayload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsedRequest = GameLogSearchRequestSchema.safeParse(requestPayload);
  if (!parsedRequest.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const searchRequest = parsedRequest.data;
  if (resolveGameLogSearchEngine() === "genkit") {
    return runGenkitSearch(searchRequest, request.signal);
  }

  const upstreamUrl = getGameLogSearchServiceUrl("/v1/search");
  if (!upstreamUrl) {
    return ndjsonResponse(
      createRetrievalUnavailableTerminal(searchRequest, "service_url_unconfigured"),
      503
    );
  }

  const upstreamController = new AbortController();
  let browserAborted = request.signal.aborted;
  let timedOut = false;
  const abortUpstream = () => {
    browserAborted = true;
    upstreamController.abort(request.signal.reason);
  };
  request.signal.addEventListener("abort", abortUpstream, { once: true });
  if (browserAborted) {
    abortUpstream();
  }
  const timeout = setTimeout(() => {
    timedOut = true;
    upstreamController.abort("connection_timeout");
  }, FIRST_BYTE_TIMEOUT_MS);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/x-ndjson",
        "content-type": "application/json"
      },
      body: JSON.stringify(searchRequest),
      signal: upstreamController.signal
    });
  } catch {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
    if (browserAborted) {
      return new Response(null, { status: 499 });
    }
    return ndjsonResponse(
      createRetrievalUnavailableTerminal(
        searchRequest,
        timedOut ? "connection_timeout" : "connection_refused"
      ),
      503
    );
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
    return ndjsonResponse(
      createRetrievalUnavailableTerminal(searchRequest, "retrieval_503"),
      503
    );
  }

  const reader = upstreamResponse.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = "";
  let firstFrame: GameLogSearchFrame | null = null;

  try {
    while (!firstFrame) {
      const chunk = await reader.read();
      if (chunk.done) {
        throw new Error("empty_upstream_stream");
      }
      if (chunk.value.byteLength > 0) {
        clearTimeout(timeout);
      }
      buffered += decoder.decode(chunk.value, { stream: true });
      const lineEnd = buffered.indexOf("\n");
      if (lineEnd >= 0) {
        const line = buffered.slice(0, lineEnd);
        buffered = buffered.slice(lineEnd + 1);
        if (!line) {
          throw new Error("blank_ndjson_line");
        }
        firstFrame = parseFrame(line);
      }
    }
  } catch {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
    await reader.cancel().catch(() => undefined);
    if (browserAborted) {
      return new Response(null, { status: 499 });
    }
    return ndjsonResponse(
      createRetrievalUnavailableTerminal(
        searchRequest,
        timedOut ? "connection_timeout" : "malformed_retrieval"
      ),
      503
    );
  }

  const order = new FrameOrderGuard(searchRequest);
  try {
    order.accept(firstFrame);
    if (firstFrame.frame_type !== "dispatch_accepted") {
      throw new Error("missing_dispatch_accepted");
    }
  } catch {
    request.signal.removeEventListener("abort", abortUpstream);
    await reader.cancel().catch(() => undefined);
    return ndjsonResponse(
      createRetrievalUnavailableTerminal(searchRequest, "malformed_retrieval"),
      503
    );
  }

  let retainedEvidence: GameLogEvidence[] = [];
  let retainedEvidenceSetHash: string | null = null;
  let indexRefreshedAt: string | null = null;
  let synthesisStarted = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`${JSON.stringify(firstFrame)}\n`));

      const emitFrame = (frame: GameLogSearchFrame) => {
        order.accept(frame);
        const frameEvidence =
          frame.frame_type === "evidence_snapshot" ||
          frame.frame_type === "terminal" ||
          frame.frame_type === "cancelled"
            ? frame.evidence
            : null;
        if (frameEvidence && !idsMatchEvidence(frameEvidence, searchRequest)) {
          throw new Error("evidence_identity_mismatch");
        }
        if (frame.frame_type === "stage" && frame.stage === "synthesizing") {
          synthesisStarted = true;
        }
        if (frame.frame_type === "evidence_snapshot") {
          retainedEvidence = [...frame.evidence];
          retainedEvidenceSetHash = frame.retrieved_evidence_set_hash;
          indexRefreshedAt = frame.evidence[0]?.index_refreshed_at ?? null;
        }
        if (frame.frame_type === "terminal") {
          retainedEvidence = [...frame.evidence];
          retainedEvidenceSetHash = frame.retrieved_evidence_set_hash;
          indexRefreshedAt = frame.index_refreshed_at;
        }
        controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`));
      };

      const emitOwnedFailure = () => {
        if (order.isDone() || browserAborted) {
          return;
        }
        const terminal =
          synthesisStarted && retainedEvidence.length > 0 && retainedEvidenceSetHash
            ? createSynthesisUnavailableTerminal(
                searchRequest,
                retainedEvidence,
                retainedEvidenceSetHash,
                indexRefreshedAt,
                "malformed_synthesis"
              )
            : createRetrievalUnavailableTerminal(searchRequest, "malformed_retrieval");
        controller.enqueue(encoder.encode(`${JSON.stringify(terminal)}\n`));
      };

      void (async () => {
        try {
          while (!order.isDone()) {
            let lineEnd = buffered.indexOf("\n");
            while (lineEnd >= 0 && !order.isDone()) {
              const line = buffered.slice(0, lineEnd);
              buffered = buffered.slice(lineEnd + 1);
              if (!line) {
                throw new Error("blank_ndjson_line");
              }
              emitFrame(parseFrame(line));
              lineEnd = buffered.indexOf("\n");
            }

            if (order.isDone()) {
              break;
            }

            const chunk = await reader.read();
            if (chunk.done) {
              buffered += decoder.decode();
              if (buffered.length > 0) {
                throw new Error("unterminated_ndjson_line");
              }
              if (!order.isDone()) {
                throw new Error("missing_terminal_frame");
              }
              break;
            }
            buffered += decoder.decode(chunk.value, { stream: true });
          }
        } catch {
          emitOwnedFailure();
        } finally {
          clearTimeout(timeout);
          request.signal.removeEventListener("abort", abortUpstream);
          await reader.cancel().catch(() => undefined);
          if (!browserAborted) {
            controller.close();
          }
        }
      })();
    },
    cancel(reason) {
      browserAborted = true;
      upstreamController.abort(reason);
      clearTimeout(timeout);
      request.signal.removeEventListener("abort", abortUpstream);
      return reader.cancel(reason);
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": NDJSON_CONTENT_TYPE,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}

export async function DELETE(request: Request): Promise<Response> {
  let requestPayload: unknown;
  try {
    requestPayload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const parsedRequest = GameLogSearchCancelRequestSchema.safeParse(requestPayload);
  if (!parsedRequest.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const cancelRequest = parsedRequest.data;
  if (resolveGameLogSearchEngine() === "genkit") {
    const outcome = cancelGenkitRun(cancelRequest.query_id, cancelRequest.correlation_id);
    return Response.json(
      GameLogSearchCancelAckSchema.parse({
        schema_version: "game-log-search.v1",
        query_id: cancelRequest.query_id,
        correlation_id: cancelRequest.correlation_id,
        acknowledged: outcome.found,
        run_status: "cancelled",
        acknowledged_at: new Date().toISOString(),
        preserved_evidence_count: outcome.preservedEvidenceCount
      }),
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  }

  const upstreamUrl = getGameLogSearchServiceUrl(
    `/v1/search/${encodeURIComponent(cancelRequest.query_id)}/cancel`
  );
  if (!upstreamUrl) {
    return Response.json(
      GameLogSearchCancelAckSchema.parse({
        schema_version: "game-log-search.v1",
        query_id: cancelRequest.query_id,
        correlation_id: cancelRequest.correlation_id,
        acknowledged: false,
        run_status: "cancelled",
        acknowledged_at: new Date().toISOString(),
        preserved_evidence_count: 0
      }),
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  const controller = new AbortController();
  const abortUpstream = () => controller.abort(request.signal.reason);
  request.signal.addEventListener("abort", abortUpstream, { once: true });
  if (request.signal.aborted) {
    abortUpstream();
  }
  const timeout = setTimeout(() => controller.abort("connection_timeout"), FIRST_BYTE_TIMEOUT_MS);

  try {
    const response = await fetch(upstreamUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({ correlation_id: cancelRequest.correlation_id }),
      signal: controller.signal
    });
    const acknowledgement = GameLogSearchCancelAckSchema.parse(await response.json());
    if (
      acknowledgement.query_id !== cancelRequest.query_id ||
      acknowledgement.correlation_id !== cancelRequest.correlation_id
    ) {
      throw new Error("cancel_identity_mismatch");
    }
    return Response.json(acknowledgement, {
      status: response.ok ? 200 : 503,
      headers: { "cache-control": "no-store" }
    });
  } catch {
    return Response.json(
      GameLogSearchCancelAckSchema.parse({
        schema_version: "game-log-search.v1",
        query_id: cancelRequest.query_id,
        correlation_id: cancelRequest.correlation_id,
        acknowledged: false,
        run_status: "cancelled",
        acknowledged_at: new Date().toISOString(),
        preserved_evidence_count: 0
      }),
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
  }
}
