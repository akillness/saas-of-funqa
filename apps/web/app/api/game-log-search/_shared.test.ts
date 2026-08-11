import {
  GameLogSearchScopeSchema,
  type GameLogEvidence,
  type GameLogSearchRequest
} from "@funqa/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createRetrievalUnavailableTerminal,
  createSynthesisUnavailableTerminal,
  getGameLogSearchServiceUrl
} from "./_shared";

const QUERY_ID = "01890f26-6b41-7abc-8def-1234567890ab";
const CORRELATION_ID = "01890f26-6b42-7abc-8def-1234567890ab";
const TIMESTAMP = "2026-08-09T12:00:00Z";
const EVIDENCE_HASH = "a".repeat(64);

const request: GameLogSearchRequest = {
  schema_version: "game-log-search.v1",
  session_id: "01890f26-6b40-7abc-8def-1234567890ab",
  workspace_id: "patch-desk",
  query_id: QUERY_ID,
  parent_query_id: null,
  correlation_id: CORRELATION_ID,
  query_text: "What changed in patch P42?",
  scope: {
    project_ids: ["scout"],
    entity_ids: ["dash"],
    time_from: null,
    time_to: null,
    source_ids: ["patch-log"],
    index_snapshot_id: "snapshot-42"
  },
  inherited_scope: null,
  scope_delta: {
    changed: false,
    entity_added: [],
    entity_removed: [],
    time_from_changed: false,
    time_from_before: null,
    time_from_after: null,
    time_to_changed: false,
    time_to_before: null,
    time_to_after: null,
    sources_added: [],
    sources_removed: []
  },
  top_k: 5
};

const evidence: GameLogEvidence = {
  schema_version: "game-log-search.v1",
  evidence_id: "E001",
  source_id: "patch-log",
  source_path: "logs/p42.jsonl",
  source_label: "Patch P42",
  project_id: "scout",
  entity_ids: ["dash"],
  event_start_at: TIMESTAMP,
  event_end_at: null,
  index_snapshot_id: "snapshot-42",
  index_refreshed_at: TIMESTAMP,
  rank: 1,
  distance: 0.1,
  score: 0.9,
  excerpt: "Scout dash cooldown changed from 8s to 6s.",
  excerpt_start: 0,
  excerpt_end: 44,
  content_sha256: "b".repeat(64),
  trust_class: "trusted_log",
  query_id: QUERY_ID,
  correlation_id: CORRELATION_ID
};

const originalServiceUrl = process.env.GAME_LOG_SEARCH_SERVICE_URL;
const originalPublicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

function restoreEnv(name: "GAME_LOG_SEARCH_SERVICE_URL" | "NEXT_PUBLIC_API_BASE_URL", value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

afterEach(() => {
  restoreEnv("GAME_LOG_SEARCH_SERVICE_URL", originalServiceUrl);
  restoreEnv("NEXT_PUBLIC_API_BASE_URL", originalPublicApiBaseUrl);
});

describe("GameLogSearchScopeSchema timestamps", () => {
  it("accepts a valid UTC timestamp with fractional seconds", () => {
    const result = GameLogSearchScopeSchema.safeParse({
      ...request.scope,
      time_from: "2026-08-09T12:00:00.123456Z"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an impossible calendar timestamp", () => {
    const result = GameLogSearchScopeSchema.safeParse({
      ...request.scope,
      time_from: "2026-02-30T12:00:00Z"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a range ordered by instant when fractional precision differs", () => {
    const result = GameLogSearchScopeSchema.safeParse({
      ...request.scope,
      time_from: "2026-08-09T12:00:00.1Z",
      time_to: "2026-08-09T12:00:00.1001Z"
    });

    expect(result.success).toBe(true);
  });
});

describe("game-log search proxy contracts", () => {
  it("does not route game-log search through NEXT_PUBLIC_API_BASE_URL", () => {
    delete process.env.GAME_LOG_SEARCH_SERVICE_URL;
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://public-api.example.test/functions";

    expect(getGameLogSearchServiceUrl("/v1/search")).toBeNull();
  });

  it("resolves a deterministic child URL from GAME_LOG_SEARCH_SERVICE_URL", () => {
    process.env.GAME_LOG_SEARCH_SERVICE_URL = "https://search.example.test/private/base/?token=discarded#fragment";

    expect(getGameLogSearchServiceUrl("v1/search")?.toString()).toBe(
      "https://search.example.test/private/base/v1/search"
    );
  });

  it.each([
    "file:///tmp/game-log-search",
    "https://user:secret@search.example.test",
    "not a URL"
  ])("rejects unsafe or malformed service URL %s", (configured) => {
    process.env.GAME_LOG_SEARCH_SERVICE_URL = configured;

    expect(getGameLogSearchServiceUrl("/v1/search")).toBeNull();
  });

  it("maps retrieval failure to a retryable terminal without changing request identity", () => {
    const terminal = createRetrievalUnavailableTerminal(request, "connection_timeout");

    expect(terminal).toMatchObject({
      outcome: "retrieval_unavailable",
      failure_owner: "retrieval",
      recovery_action: "retry_retrieval",
      boundary_reason_code: "connection_timeout",
      query_id: QUERY_ID,
      parent_query_id: null,
      correlation_id: CORRELATION_ID,
      query_text: request.query_text,
      evidence: []
    });
  });

  it("preserves retrieved evidence and identity when only synthesis is unavailable", () => {
    const terminal = createSynthesisUnavailableTerminal(
      request,
      [evidence],
      EVIDENCE_HASH,
      TIMESTAMP,
      "synthesis_timeout"
    );

    expect(terminal).toMatchObject({
      outcome: "synthesis_unavailable",
      failure_owner: "synthesis",
      recovery_action: "open_raw_evidence",
      boundary_reason_code: "synthesis_timeout",
      query_id: QUERY_ID,
      correlation_id: CORRELATION_ID,
      retrieved_evidence_set_hash: EVIDENCE_HASH
    });
    expect(terminal.evidence).toEqual([evidence]);
  });
});
