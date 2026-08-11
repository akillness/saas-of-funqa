import {
  GameLogSearchRequestSchema,
  GameLogSearchTerminalSchema,
  type GameLogEvidence,
  type GameLogSearchOutcome,
  type GameLogSearchTerminal
} from "@funqa/contracts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { getDictionary, type Messages } from "../../lib/i18n";
import { SearchStreamPanel } from "./search-stream-panel";

const QUERY_ID = "01890f26-6b41-7abc-8def-1234567890ab";
const CORRELATION_ID = "01890f26-6b42-7abc-8def-1234567890ab";
const TIMESTAMP = "2026-08-09T12:00:00Z";
const EVIDENCE_HASH = "a".repeat(64);

type PatchDeskMessages = Messages["patchDesk"];

const request = GameLogSearchRequestSchema.parse({
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
});

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

const terminalInvariants = {
  supported: {
    failure_owner: "none",
    confidence: "supported",
    boundary_reason_code: null,
    recovery_action: "inspect_claim_traces"
  },
  no_hits: {
    failure_owner: "none",
    confidence: "none",
    boundary_reason_code: "no_indexed_match",
    recovery_action: "broaden_scope"
  },
  weak_support: {
    failure_owner: "none",
    confidence: "weak",
    boundary_reason_code: "strict_support_predicate_failed",
    recovery_action: "refine_query"
  },
  stale_index: {
    failure_owner: "retrieval",
    confidence: "none",
    boundary_reason_code: "requested_coverage_exceeds_snapshot",
    recovery_action: "refresh_archive"
  },
  retrieval_unavailable: {
    failure_owner: "retrieval",
    confidence: "none",
    boundary_reason_code: "connection_timeout",
    recovery_action: "retry_retrieval"
  },
  synthesis_unavailable: {
    failure_owner: "synthesis",
    confidence: "none",
    boundary_reason_code: "synthesis_timeout",
    recovery_action: "open_raw_evidence"
  }
} as const;

function makeTerminal(outcome: GameLogSearchOutcome): GameLogSearchTerminal {
  const hasEvidence = outcome === "supported" || outcome === "weak_support" || outcome === "synthesis_unavailable";
  const finding =
    outcome === "supported"
      ? {
          summary: "Scout dash cooldown changed.",
          claims: [{ claim_id: "C1", text: "The cooldown changed.", material: true as const }],
          claim_evidence_links: [{ claim_id: "C1", evidence_id: evidence.evidence_id, relation: "supports" as const }],
          material_claim_count: 1,
          supported_material_claim_count: 1,
          unsupported_material_claim_count: 0,
          claim_coverage: 1
        }
      : null;

  return GameLogSearchTerminalSchema.parse({
    schema_version: "game-log-search.v1",
    frame_type: "terminal",
    run_status: "completed",
    outcome,
    ...terminalInvariants[outcome],
    query_id: QUERY_ID,
    parent_query_id: null,
    correlation_id: CORRELATION_ID,
    query_text: request.query_text,
    scope: request.scope,
    scope_delta: request.scope_delta,
    index_snapshot_id: request.scope.index_snapshot_id,
    index_refreshed_at: TIMESTAMP,
    index_coverage_through: TIMESTAMP,
    retrieved_evidence_set_hash: hasEvidence ? EVIDENCE_HASH : null,
    evidence: hasEvidence ? [evidence] : [],
    finding,
    model_profile_id: outcome === "supported" ? "local-model" : null,
    model_quantization: outcome === "supported" ? "q4" : null,
    context_limit_tokens: outcome === "supported" ? 4096 : null,
    evidence_input_tokens: outcome === "supported" ? 128 : null,
    output_tokens: outcome === "supported" ? 32 : null,
    truncation_reason: null
  });
}

const terminalCases = [
  {
    outcome: "supported",
    expected: (copy: PatchDeskMessages) => [copy.supportedTitle, copy.supportedBody, copy.inspectTraces]
  },
  {
    outcome: "no_hits",
    expected: (copy: PatchDeskMessages) => [copy.noHitsTitle, copy.noHitsBody, copy.broadenScope]
  },
  {
    outcome: "weak_support",
    expected: (copy: PatchDeskMessages) => [copy.weakTitle, copy.weakBody, copy.refineQuery]
  },
  {
    outcome: "stale_index",
    expected: (copy: PatchDeskMessages) => [
      copy.staleTitle,
      copy.staleBody.replace("{timestamp}", TIMESTAMP),
      copy.refreshArchive
    ]
  },
  {
    outcome: "retrieval_unavailable",
    expected: (copy: PatchDeskMessages) => [
      copy.retrievalUnavailableTitle,
      copy.retrievalUnavailableBody,
      copy.retryRetrieval
    ]
  },
  {
    outcome: "synthesis_unavailable",
    expected: (copy: PatchDeskMessages) => [
      copy.synthesisUnavailableTitle,
      copy.synthesisUnavailableBody,
      copy.openRawEvidence
    ]
  }
] satisfies readonly {
  outcome: GameLogSearchOutcome;
  expected: (copy: PatchDeskMessages) => readonly string[];
}[];

function renderTerminal(outcome: GameLogSearchOutcome, messages: PatchDeskMessages) {
  const terminal = makeTerminal(outcome);
  return renderToStaticMarkup(
    createElement(SearchStreamPanel, {
      messages,
      phase: "completed",
      stage: null,
      currentRequest: request,
      evidence: terminal.evidence,
      terminal,
      onRecovery: vi.fn()
    })
  );
}

describe.each(["en", "ko"] as const)("Patch Desk terminal copy (%s)", (locale) => {
  const messages = getDictionary(locale).patchDesk;

  it.each(terminalCases)("renders the $outcome terminal and its recovery action", ({ outcome, expected }) => {
    const markup = renderTerminal(outcome, messages);

    for (const copy of expected(messages)) {
      expect(markup).toContain(copy);
    }
  });

  it("renders stopped as evidence-preserving and offers query revision", () => {
    const markup = renderToStaticMarkup(
      createElement(SearchStreamPanel, {
        messages,
        phase: "stopped",
        stage: null,
        currentRequest: request,
        evidence: [evidence],
        terminal: null,
        onRecovery: vi.fn()
      })
    );

    expect(markup).toContain(messages.stopped);
    expect(markup).toContain(messages.reviseQuery);
  });

  it("renders decorative skeleton placeholders while loading without evidence", () => {
    const markup = renderToStaticMarkup(
      createElement(SearchStreamPanel, {
        messages,
        phase: "loading",
        stage: "retrieving",
        currentRequest: request,
        evidence: [],
        terminal: null,
        onRecovery: vi.fn()
      })
    );

    expect(markup).toContain(messages.dispatchStarted);
    expect(markup).toContain('class="patch-skeleton-stack" aria-hidden="true"');
  });

  it("renders the trust class as a data-attributed badge on evidence provenance", () => {
    const markup = renderTerminal("supported", messages);

    expect(markup).toContain('data-trust="trusted_log"');
    expect(markup).toContain(evidence.trust_class);
  });
});
