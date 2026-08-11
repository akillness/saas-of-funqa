import "server-only";

import {
  GameLogSearchHealthSchema,
  GameLogSearchTerminalSchema,
  type GameLogSearchHealth,
  type GameLogSearchRequest,
  type GameLogSearchTerminal,
  type GameLogSearchUpstreamHealth
} from "@funqa/contracts";

export const FIRST_BYTE_TIMEOUT_MS = 3_000;
export const NDJSON_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

export type RetrievalUnavailableReason =
  | "service_url_unconfigured"
  | "connection_refused"
  | "connection_timeout"
  | "retrieval_503"
  | "malformed_retrieval";

export function getGameLogSearchServiceUrl(pathname: string): URL | null {
  const configured = process.env.GAME_LOG_SEARCH_SERVICE_URL?.trim();
  if (!configured) {
    return null;
  }

  try {
    const base = new URL(configured);
    if ((base.protocol !== "http:" && base.protocol !== "https:") || base.username || base.password) {
      return null;
    }

    const basePath = base.pathname.replace(/\/$/, "");
    const childPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    base.pathname = `${basePath}${childPath}`;
    base.search = "";
    base.hash = "";
    return base;
  } catch {
    return null;
  }
}

export function createRetrievalUnavailableTerminal(
  request: GameLogSearchRequest,
  reason: RetrievalUnavailableReason
): GameLogSearchTerminal {
  return GameLogSearchTerminalSchema.parse({
    schema_version: "game-log-search.v1",
    frame_type: "terminal",
    run_status: "completed",
    outcome: "retrieval_unavailable",
    failure_owner: "retrieval",
    confidence: "none",
    query_id: request.query_id,
    parent_query_id: request.parent_query_id,
    correlation_id: request.correlation_id,
    query_text: request.query_text,
    scope: request.scope,
    scope_delta: request.scope_delta,
    index_snapshot_id: request.scope.index_snapshot_id,
    index_refreshed_at: null,
    index_coverage_through: null,
    retrieved_evidence_set_hash: null,
    evidence: [],
    finding: null,
    boundary_reason_code: reason,
    recovery_action: "retry_retrieval",
    model_profile_id: null,
    model_quantization: null,
    context_limit_tokens: null,
    evidence_input_tokens: null,
    output_tokens: null,
    truncation_reason: null
  });
}

export function createSynthesisUnavailableTerminal(
  request: GameLogSearchRequest,
  evidence: GameLogSearchTerminal["evidence"],
  retrievedEvidenceSetHash: string,
  indexRefreshedAt: string | null,
  reason: "synthesis_503" | "synthesis_timeout" | "malformed_synthesis"
): GameLogSearchTerminal {
  return GameLogSearchTerminalSchema.parse({
    schema_version: "game-log-search.v1",
    frame_type: "terminal",
    run_status: "completed",
    outcome: "synthesis_unavailable",
    failure_owner: "synthesis",
    confidence: "none",
    query_id: request.query_id,
    parent_query_id: request.parent_query_id,
    correlation_id: request.correlation_id,
    query_text: request.query_text,
    scope: request.scope,
    scope_delta: request.scope_delta,
    index_snapshot_id: request.scope.index_snapshot_id,
    index_refreshed_at: indexRefreshedAt,
    index_coverage_through: null,
    retrieved_evidence_set_hash: retrievedEvidenceSetHash,
    evidence,
    finding: null,
    boundary_reason_code: reason,
    recovery_action: "open_raw_evidence",
    model_profile_id: null,
    model_quantization: null,
    context_limit_tokens: null,
    evidence_input_tokens: null,
    output_tokens: null,
    truncation_reason: null
  });
}

export function createUnavailableHealth(reasonCode: string, checkedAt = new Date().toISOString()): GameLogSearchHealth {
  return GameLogSearchHealthSchema.parse({
    schema_version: "game-log-search.v1",
    overall: "offline",
    proxy: { status: "ready", checked_at: checkedAt, reason_code: null },
    retrieval: { status: "offline", checked_at: checkedAt, reason_code: reasonCode },
    synthesis: { status: "offline", checked_at: checkedAt, reason_code: reasonCode },
    index_snapshot_id: null,
    index_refreshed_at: null,
    index_coverage_through: null,
    model_profile_id: null,
    build_id: "web-proxy"
  });
}

export function createProxyHealth(upstream: GameLogSearchUpstreamHealth): GameLogSearchHealth {
  const checkedAt = new Date().toISOString();
  const overall =
    upstream.retrieval.status === "ready" && upstream.synthesis.status === "ready"
      ? "ready"
      : upstream.retrieval.status === "checking" || upstream.synthesis.status === "checking"
        ? "checking"
        : "offline";

  return GameLogSearchHealthSchema.parse({
    schema_version: "game-log-search.v1",
    overall,
    proxy: { status: "ready", checked_at: checkedAt, reason_code: null },
    retrieval: upstream.retrieval,
    synthesis: upstream.synthesis,
    index_snapshot_id: upstream.index_snapshot_id,
    index_refreshed_at: upstream.index_refreshed_at,
    index_coverage_through: upstream.index_coverage_through,
    model_profile_id: upstream.model_profile_id,
    build_id: upstream.build_id
  });
}

export function ndjsonResponse(
  payload: GameLogSearchTerminal,
  status: number,
  headers?: HeadersInit
): Response {
  return new Response(`${JSON.stringify(payload)}\n`, {
    status,
    headers: {
      "content-type": NDJSON_CONTENT_TYPE,
      "cache-control": "no-store",
      ...headers
    }
  });
}
