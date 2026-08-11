import {
  GameLogSearchCancelAckSchema,
  GameLogSearchCancelRequestSchema,
  GameLogSearchFrameSchema,
  GameLogSearchHealthSchema,
  GameLogSearchRequestSchema,
  type GameLogSearchCancelAck,
  type GameLogSearchFrame,
  type GameLogSearchHealth,
  type GameLogSearchRequest
} from "@funqa/contracts";

export class GameLogSearchProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameLogSearchProtocolError";
  }
}

export function createUuidV7(now = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = BigInt(now);
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

class BrowserFrameOrderGuard {
  private phase: "start" | "accepted" | "retrieving" | "ranking" | "evidence" | "synthesizing" | "done" = "start";

  constructor(private readonly request: GameLogSearchRequest) {}

  accept(frame: GameLogSearchFrame): void {
    if (frame.query_id !== this.request.query_id || frame.correlation_id !== this.request.correlation_id) {
      throw new GameLogSearchProtocolError("frame_identity_mismatch");
    }

    if (this.phase === "start" && frame.frame_type === "terminal") {
      if (
        frame.outcome !== "retrieval_unavailable" ||
        frame.parent_query_id !== this.request.parent_query_id ||
        frame.query_text !== this.request.query_text
      ) {
        throw new GameLogSearchProtocolError("initial_terminal_mismatch");
      }
      this.phase = "done";
      return;
    }

    if (frame.frame_type === "dispatch_accepted") {
      if (this.phase !== "start" || frame.parent_query_id !== this.request.parent_query_id) {
        throw new GameLogSearchProtocolError("dispatch_order_mismatch");
      }
      this.phase = "accepted";
      return;
    }

    if (this.phase === "start" || this.phase === "done") {
      throw new GameLogSearchProtocolError("frame_order_mismatch");
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
        throw new GameLogSearchProtocolError("stage_order_mismatch");
      }
      this.phase = frame.stage;
      return;
    }

    if (frame.frame_type === "evidence_snapshot") {
      if (this.phase !== "ranking") {
        throw new GameLogSearchProtocolError("evidence_order_mismatch");
      }
      this.phase = "evidence";
      return;
    }

    if (frame.frame_type === "terminal") {
      if (frame.parent_query_id !== this.request.parent_query_id || frame.query_text !== this.request.query_text) {
        throw new GameLogSearchProtocolError("terminal_identity_mismatch");
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
        throw new GameLogSearchProtocolError("terminal_order_mismatch");
      }
      this.phase = "done";
      return;
    }

    this.phase = "done";
  }

  finish(): void {
    if (this.phase !== "done") {
      throw new GameLogSearchProtocolError("stream_ended_without_terminal");
    }
  }
}

function parseFrameLine(line: string): GameLogSearchFrame {
  if (!line) {
    throw new GameLogSearchProtocolError("blank_ndjson_line");
  }
  try {
    return GameLogSearchFrameSchema.parse(JSON.parse(line));
  } catch (error) {
    if (error instanceof GameLogSearchProtocolError) {
      throw error;
    }
    throw new GameLogSearchProtocolError("invalid_ndjson_frame");
  }
}

function assertEvidenceIdentity(frame: GameLogSearchFrame, request: GameLogSearchRequest): void {
  const evidence =
    frame.frame_type === "evidence_snapshot" ||
    frame.frame_type === "terminal" ||
    frame.frame_type === "cancelled"
      ? frame.evidence
      : [];
  if (
    evidence.some(
      (item) => item.query_id !== request.query_id || item.correlation_id !== request.correlation_id
    )
  ) {
    throw new GameLogSearchProtocolError("evidence_identity_mismatch");
  }
}

export async function getGameLogSearchHealth(signal?: AbortSignal): Promise<GameLogSearchHealth> {
  const response = await fetch("/api/game-log-search/health", {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json" },
    signal
  });
  if (!response.ok) {
    throw new GameLogSearchProtocolError("health_request_failed");
  }
  return GameLogSearchHealthSchema.parse(await response.json());
}

export async function* streamGameLogSearch(
  input: GameLogSearchRequest,
  signal: AbortSignal
): AsyncGenerator<GameLogSearchFrame, void, undefined> {
  const request = GameLogSearchRequestSchema.parse(input);
  const response = await fetch("/api/game-log-search/search", {
    method: "POST",
    cache: "no-store",
    headers: {
      accept: "application/x-ndjson",
      "content-type": "application/json"
    },
    body: JSON.stringify(request),
    signal
  });

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/x-ndjson") || !response.body) {
    throw new GameLogSearchProtocolError("search_response_not_ndjson");
  }

  const order = new BrowserFrameOrderGuard(request);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";

  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) {
        buffered += decoder.decode();
        if (buffered.length > 0) {
          throw new GameLogSearchProtocolError("unterminated_ndjson_line");
        }
        order.finish();
        return;
      }

      buffered += decoder.decode(chunk.value, { stream: true });
      let lineEnd = buffered.indexOf("\n");
      while (lineEnd >= 0) {
        const frame = parseFrameLine(buffered.slice(0, lineEnd));
        buffered = buffered.slice(lineEnd + 1);
        order.accept(frame);
        assertEvidenceIdentity(frame, request);
        yield frame;
        if (frame.frame_type === "terminal" || frame.frame_type === "cancelled") {
          await reader.cancel();
          order.finish();
          return;
        }
        lineEnd = buffered.indexOf("\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function cancelGameLogSearch(
  queryId: string,
  correlationId: string
): Promise<GameLogSearchCancelAck> {
  const request = GameLogSearchCancelRequestSchema.parse({
    query_id: queryId,
    correlation_id: correlationId
  });
  const response = await fetch("/api/game-log-search/search", {
    method: "DELETE",
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(request)
  });
  const acknowledgement = GameLogSearchCancelAckSchema.parse(await response.json());
  if (
    acknowledgement.query_id !== request.query_id ||
    acknowledgement.correlation_id !== request.correlation_id
  ) {
    throw new GameLogSearchProtocolError("cancel_identity_mismatch");
  }
  return acknowledgement;
}
