import type {
  GameLogEvidence,
  GameLogSearchFrame,
  GameLogSearchRequest,
  GameLogSearchTerminal
} from "@funqa/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  cancelGameLogSearch,
  GameLogSearchProtocolError,
  streamGameLogSearch
} from "./game-log-search-client";

const QUERY_ID = "01890f26-6b41-7abc-8def-1234567890ab";
const CORRELATION_ID = "01890f26-6b42-7abc-8def-1234567890ab";
const OTHER_QUERY_ID = "01890f26-6b43-7abc-8def-1234567890ab";
const OTHER_CORRELATION_ID = "01890f26-6b44-7abc-8def-1234567890ab";
const TIMESTAMP = "2026-08-09T12:00:00Z";
const EVIDENCE_SET_HASH = "a".repeat(64);

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

function makeEvidence(
  evidenceId: string,
  rank: number,
  trustClass: GameLogEvidence["trust_class"] = "trusted_log",
  queryId = QUERY_ID,
  correlationId = CORRELATION_ID
): GameLogEvidence {
  return {
    schema_version: "game-log-search.v1",
    evidence_id: evidenceId,
    source_id: `source-${rank}`,
    source_path: `logs/${evidenceId}.jsonl`,
    source_label: `Log ${evidenceId}`,
    project_id: "scout",
    entity_ids: ["dash"],
    event_start_at: TIMESTAMP,
    event_end_at: null,
    index_snapshot_id: "snapshot-42",
    index_refreshed_at: TIMESTAMP,
    rank,
    distance: rank / 10,
    score: 1 - rank / 10,
    excerpt: `Evidence excerpt ${evidenceId}`,
    excerpt_start: 0,
    excerpt_end: 20,
    content_sha256: String(rank).repeat(64),
    trust_class: trustClass,
    query_id: queryId,
    correlation_id: correlationId
  };
}

const relationEvidence = [
  makeEvidence("E-supports", 1),
  makeEvidence("E-contradicts", 2),
  makeEvidence("E-supersedes", 3),
  makeEvidence("E-context", 4),
  makeEvidence("E-untrusted", 5, "untrusted_data")
];

function supportedTerminal(): GameLogSearchTerminal {
  return {
    schema_version: "game-log-search.v1",
    frame_type: "terminal",
    run_status: "completed",
    outcome: "supported",
    failure_owner: "none",
    confidence: "supported",
    query_id: QUERY_ID,
    parent_query_id: null,
    correlation_id: CORRELATION_ID,
    query_text: request.query_text,
    scope: request.scope,
    scope_delta: request.scope_delta,
    index_snapshot_id: request.scope.index_snapshot_id,
    index_refreshed_at: TIMESTAMP,
    index_coverage_through: TIMESTAMP,
    retrieved_evidence_set_hash: EVIDENCE_SET_HASH,
    evidence: relationEvidence,
    finding: {
      summary: "Scout dash cooldown changed.",
      claims: [{ claim_id: "C1", text: "The cooldown changed.", material: true }],
      claim_evidence_links: [
        { claim_id: "C1", evidence_id: "E-supports", relation: "supports" },
        { claim_id: "C1", evidence_id: "E-contradicts", relation: "contradicts" },
        { claim_id: "C1", evidence_id: "E-supersedes", relation: "supersedes" },
        { claim_id: "C1", evidence_id: "E-context", relation: "context_only" },
        { claim_id: "C1", evidence_id: "E-untrusted", relation: "untrusted_data" }
      ],
      material_claim_count: 1,
      supported_material_claim_count: 1,
      unsupported_material_claim_count: 0,
      claim_coverage: 1
    },
    boundary_reason_code: null,
    recovery_action: "inspect_claim_traces",
    model_profile_id: "local-model",
    model_quantization: "q4",
    context_limit_tokens: 4096,
    evidence_input_tokens: 256,
    output_tokens: 64,
    truncation_reason: null
  };
}

function acceptedFrame(): GameLogSearchFrame {
  return {
    schema_version: "game-log-search.v1",
    frame_type: "dispatch_accepted",
    run_status: "accepted",
    query_id: QUERY_ID,
    parent_query_id: null,
    correlation_id: CORRELATION_ID,
    accepted_at: TIMESTAMP,
    scope: request.scope,
    scope_delta: request.scope_delta
  };
}

function stageFrame(stage: "retrieving" | "ranking" | "synthesizing"): GameLogSearchFrame {
  return {
    schema_version: "game-log-search.v1",
    frame_type: "stage",
    run_status: "running",
    query_id: QUERY_ID,
    correlation_id: CORRELATION_ID,
    stage,
    started_at: TIMESTAMP
  };
}

function evidenceFrame(evidence = relationEvidence): GameLogSearchFrame {
  return {
    schema_version: "game-log-search.v1",
    frame_type: "evidence_snapshot",
    run_status: "running",
    query_id: QUERY_ID,
    correlation_id: CORRELATION_ID,
    retrieved_evidence_set_hash: EVIDENCE_SET_HASH,
    evidence
  };
}

function ndjsonResponse(frames: readonly GameLogSearchFrame[]): Response {
  return new Response(`${frames.map((frame) => JSON.stringify(frame)).join("\n")}\n`, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8" }
  });
}

async function collectFrames(source: AsyncGenerator<GameLogSearchFrame, void, undefined>) {
  const frames: GameLogSearchFrame[] = [];
  for await (const frame of source) {
    frames.push(frame);
  }
  return frames;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("game-log search client protocol", () => {
  it("preserves request identity and every evidence relation while parsing NDJSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        ndjsonResponse([
          acceptedFrame(),
          stageFrame("retrieving"),
          stageFrame("ranking"),
          evidenceFrame(),
          stageFrame("synthesizing"),
          supportedTerminal()
        ])
      )
    );

    const frames = await collectFrames(streamGameLogSearch(request, new AbortController().signal));
    const terminal = frames.at(-1);

    expect(terminal?.frame_type).toBe("terminal");
    if (terminal?.frame_type !== "terminal") {
      throw new Error("expected terminal frame");
    }
    expect(terminal.query_id).toBe(QUERY_ID);
    expect(terminal.correlation_id).toBe(CORRELATION_ID);
    expect(terminal.evidence.map(({ query_id, correlation_id }) => ({ query_id, correlation_id }))).toEqual(
      relationEvidence.map(() => ({ query_id: QUERY_ID, correlation_id: CORRELATION_ID }))
    );
    expect(terminal.finding?.claim_evidence_links.map((link) => link.relation)).toEqual([
      "supports",
      "contradicts",
      "supersedes",
      "context_only",
      "untrusted_data"
    ]);
  });

  it("rejects evidence whose identity differs from the active request", async () => {
    const mismatchedEvidence = makeEvidence(
      "E-mismatch",
      1,
      "trusted_log",
      OTHER_QUERY_ID,
      CORRELATION_ID
    );
    const cancelled: GameLogSearchFrame = {
      schema_version: "game-log-search.v1",
      frame_type: "cancelled",
      run_status: "cancelled",
      query_id: QUERY_ID,
      correlation_id: CORRELATION_ID,
      cancelled_at: TIMESTAMP,
      evidence: [mismatchedEvidence]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ndjsonResponse([acceptedFrame(), cancelled])));

    await expect(
      collectFrames(streamGameLogSearch(request, new AbortController().signal))
    ).rejects.toThrowError(new GameLogSearchProtocolError("evidence_identity_mismatch"));
  });

  it("accepts the stopped terminal frame and preserves already retrieved evidence", async () => {
    const cancelled: GameLogSearchFrame = {
      schema_version: "game-log-search.v1",
      frame_type: "cancelled",
      run_status: "cancelled",
      query_id: QUERY_ID,
      correlation_id: CORRELATION_ID,
      cancelled_at: TIMESTAMP,
      evidence: [relationEvidence[0]]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ndjsonResponse([acceptedFrame(), cancelled])));

    const frames = await collectFrames(streamGameLogSearch(request, new AbortController().signal));

    expect(frames.at(-1)).toEqual(cancelled);
  });

  it("rejects a cancellation acknowledgement for another correlation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          schema_version: "game-log-search.v1",
          query_id: QUERY_ID,
          correlation_id: OTHER_CORRELATION_ID,
          acknowledged: true,
          run_status: "cancelled",
          acknowledged_at: TIMESTAMP,
          preserved_evidence_count: 1
        })
      )
    );

    await expect(cancelGameLogSearch(QUERY_ID, CORRELATION_ID)).rejects.toThrowError(
      new GameLogSearchProtocolError("cancel_identity_mismatch")
    );
  });
});
