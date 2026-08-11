import {
  GameLogFindingSchema,
  GameLogSearchFrameSchema,
  GameLogSearchHealthSchema,
  type GameLogEvidence,
  type GameLogSearchFrame,
  type GameLogSearchRequest,
  type GameLogSearchScope
} from "@funqa/contracts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/api/game-log-search/_corpus", async () => vi.importActual("./_corpus"));

import { INDEXED_CORPUS, evidenceSetHash } from "./_corpus";
import {
  createGenkitHealth,
  hasDeterministicWeakSupportBoundary,
  requestedCoverageIsStale,
  resolveGameLogSearchEngine,
  retrieveEvidence,
  runGenkitSearch,
  validateSynthesisDraft,
  type SynthesisDraft
} from "./_genkit-engine";

const SESSION_ID = "01890f26-6b40-7abc-8def-1234567890ab";
const QUERY_ID = "01890f26-6b41-7abc-8def-1234567890ab";
const CORRELATION_ID = "01890f26-6b42-7abc-8def-1234567890ab";
const SIM_INDEX_SNAPSHOT_ID = "sim-index-v1";
const SIM_INDEX_COVERAGE_THROUGH = "2026-08-08T12:00:00Z";

function makeScope(overrides: Partial<GameLogSearchScope> = {}): GameLogSearchScope {
  return {
    project_ids: [],
    entity_ids: [],
    time_from: null,
    time_to: null,
    source_ids: [],
    index_snapshot_id: SIM_INDEX_SNAPSHOT_ID,
    ...overrides
  };
}

function makeRequest(
  overrides: Partial<Omit<GameLogSearchRequest, "scope">> & {
    scope?: Partial<GameLogSearchScope>;
  } = {}
): GameLogSearchRequest {
  const { scope, ...rest } = overrides;
  return {
    schema_version: "game-log-search.v1",
    session_id: SESSION_ID,
    workspace_id: "patch-desk",
    query_id: QUERY_ID,
    parent_query_id: null,
    correlation_id: CORRELATION_ID,
    query_text: "What changed after patch P42 for Scout dash cooldown?",
    scope: makeScope(scope),
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
    top_k: 8,
    ...rest
  };
}

/** P42/Scout request whose deterministic retrieval is E001 > E003 > E002. */
function makeP42Request(overrides: Parameters<typeof makeRequest>[0] = {}): GameLogSearchRequest {
  return makeRequest({
    scope: { project_ids: ["Alpha"], entity_ids: ["P42", "Scout"], ...overrides.scope },
    ...overrides
  });
}

async function readNdjsonFrames(response: Response): Promise<unknown[]> {
  const body = response.body;
  expect(body).not.toBeNull();
  const reader = body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
  }
  buffer += decoder.decode();
  return buffer
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as unknown);
}

function parseFrames(rawFrames: unknown[]): GameLogSearchFrame[] {
  return rawFrames.map((raw) => {
    const parsed = GameLogSearchFrameSchema.safeParse(raw);
    expect(parsed.success, `frame failed schema parse: ${JSON.stringify(raw)}`).toBe(true);
    return parsed.success ? parsed.data : (undefined as never);
  });
}

const MANAGED_ENV = [
  "GAME_LOG_SEARCH_ENGINE",
  "GAME_LOG_SEARCH_SERVICE_URL",
  "GEMINI_API_KEY"
] as const;

type ManagedEnvName = (typeof MANAGED_ENV)[number];

let savedEnv: Record<ManagedEnvName, string | undefined>;

beforeEach(() => {
  savedEnv = {
    GAME_LOG_SEARCH_ENGINE: process.env.GAME_LOG_SEARCH_ENGINE,
    GAME_LOG_SEARCH_SERVICE_URL: process.env.GAME_LOG_SEARCH_SERVICE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  };
  for (const name of MANAGED_ENV) {
    delete process.env[name];
  }
});

afterEach(() => {
  for (const name of MANAGED_ENV) {
    const value = savedEnv[name];
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

describe("resolveGameLogSearchEngine", () => {
  it("honors explicit GAME_LOG_SEARCH_ENGINE=local even when no service URL is set", () => {
    process.env.GAME_LOG_SEARCH_ENGINE = "local";

    expect(resolveGameLogSearchEngine()).toBe("local");
  });

  it("honors explicit GAME_LOG_SEARCH_ENGINE=genkit even when a service URL is set", () => {
    process.env.GAME_LOG_SEARCH_ENGINE = "genkit";
    process.env.GAME_LOG_SEARCH_SERVICE_URL = "http://127.0.0.1:8787";

    expect(resolveGameLogSearchEngine()).toBe("genkit");
  });

  it("normalizes case and surrounding whitespace in the explicit setting", () => {
    process.env.GAME_LOG_SEARCH_ENGINE = "  LOCAL  ";

    expect(resolveGameLogSearchEngine()).toBe("local");
  });

  it("falls back to local when unset and GAME_LOG_SEARCH_SERVICE_URL is configured", () => {
    process.env.GAME_LOG_SEARCH_SERVICE_URL = "http://127.0.0.1:8787";

    expect(resolveGameLogSearchEngine()).toBe("local");
  });

  it("falls back to genkit when both variables are unset", () => {
    expect(resolveGameLogSearchEngine()).toBe("genkit");
  });

  it("treats an unknown engine value as unset", () => {
    process.env.GAME_LOG_SEARCH_ENGINE = "vm";

    expect(resolveGameLogSearchEngine()).toBe("genkit");

    process.env.GAME_LOG_SEARCH_SERVICE_URL = "http://127.0.0.1:8787";

    expect(resolveGameLogSearchEngine()).toBe("local");
  });
});

describe("retrieveEvidence", () => {
  it("ranks E001 first for the scoped P42/Scout query with contiguous ranks and derived distance", () => {
    const request = makeP42Request();

    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E001", "E003", "E002"]);
    expect(evidence.map((item) => item.rank)).toEqual([1, 2, 3]);
    for (const item of evidence) {
      expect(item.distance).toBeCloseTo(1 - item.score, 6);
      expect(item.query_id).toBe(QUERY_ID);
      expect(item.correlation_id).toBe(CORRELATION_ID);
      expect(item.index_snapshot_id).toBe(SIM_INDEX_SNAPSHOT_ID);
    }
    expect(evidence[0].score).toBeGreaterThan(evidence[1].score);
  });

  it("returns no evidence for an unscoped query with no lexical overlap", () => {
    const request = makeRequest({ query_text: "zzz qqq unrelated topic" });

    expect(retrieveEvidence(request)).toEqual([]);
  });

  it("respects top_k", () => {
    const request = makeP42Request({ top_k: 2 });

    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E001", "E003"]);
    expect(evidence.map((item) => item.rank)).toEqual([1, 2]);
  });

  it("excludes records whose source_id is not in scope.source_ids", () => {
    const request = makeP42Request({
      scope: {
        project_ids: ["Alpha"],
        entity_ids: ["P42", "Scout"],
        source_ids: ["qa/P42-playtest.log"]
      }
    });

    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E003"]);
  });

  it("never retrieves E007: it is absent from the frozen corpus", () => {
    expect(INDEXED_CORPUS.some((record) => record.evidence_id === "E007")).toBe(false);

    // Scope-constrained request returns every indexed record regardless of score.
    const request = makeRequest({
      query_text: "zzz qqq unrelated topic",
      scope: { project_ids: ["Alpha"] },
      top_k: 20
    });

    const evidence = retrieveEvidence(request);

    expect(evidence).toHaveLength(INDEXED_CORPUS.length);
    expect(new Set(evidence.map((item) => item.evidence_id))).toEqual(
      new Set(["E001", "E002", "E003", "E004", "E005", "E006", "E008", "E009"])
    );
    expect(evidence.some((item) => item.evidence_id === "E007")).toBe(false);
  });
});

describe("requestedCoverageIsStale", () => {
  it("is stale when time_to exceeds the index coverage boundary", () => {
    const request = makeRequest({ scope: { time_to: "2026-08-08T12:00:01Z" } });

    expect(requestedCoverageIsStale(request)).toBe(true);
  });

  it("is fresh exactly at the coverage boundary", () => {
    const request = makeRequest({ scope: { time_to: SIM_INDEX_COVERAGE_THROUGH } });

    expect(requestedCoverageIsStale(request)).toBe(false);
  });

  it("is fresh for an earlier time_to", () => {
    const request = makeRequest({ scope: { time_to: "2026-08-05T00:00:00Z" } });

    expect(requestedCoverageIsStale(request)).toBe(false);
  });

  it("is fresh when time_to is null", () => {
    expect(requestedCoverageIsStale(makeRequest())).toBe(false);
  });
});

describe("hasDeterministicWeakSupportBoundary", () => {
  it("flags an E002-only evidence set for a causal query", () => {
    const request = makeRequest({
      query_text: "What caused the Scout win rate change after P42?",
      scope: {
        project_ids: ["Alpha"],
        source_ids: ["telemetry/patch-P42-summary.log"]
      }
    });
    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E002"]);
    expect(hasDeterministicWeakSupportBoundary(request, evidence)).toBe(true);
  });

  it("flags an all-untrusted evidence set", () => {
    const request = makeRequest({
      query_text: "What does the imported community note say?",
      scope: { project_ids: ["Alpha"], entity_ids: ["ImportedNote"] }
    });
    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E009"]);
    expect(evidence.every((item) => item.trust_class === "untrusted_data")).toBe(true);
    expect(hasDeterministicWeakSupportBoundary(request, evidence)).toBe(true);
  });

  it("flags a multi-project scope the evidence does not fully cover", () => {
    const request = makeRequest({
      scope: { project_ids: ["Alpha", "Beta"], entity_ids: ["P42", "Scout"] }
    });
    const evidence = retrieveEvidence(request);

    expect(evidence.length).toBeGreaterThan(0);
    expect(new Set(evidence.map((item) => item.project_id))).toEqual(new Set(["Alpha"]));
    expect(hasDeterministicWeakSupportBoundary(request, evidence)).toBe(true);
  });

  it("stays quiet for a normal single-project retrieval", () => {
    const request = makeP42Request();
    const evidence = retrieveEvidence(request);

    expect(evidence.map((item) => item.evidence_id)).toEqual(["E001", "E003", "E002"]);
    expect(hasDeterministicWeakSupportBoundary(request, evidence)).toBe(false);
  });
});

describe("validateSynthesisDraft", () => {
  function p42Fixture(): { request: GameLogSearchRequest; evidence: GameLogEvidence[] } {
    const request = makeP42Request();
    return { request, evidence: retrieveEvidence(request) };
  }

  const VALID_C1 = "Patch P42 changed Scout dash cooldown from 8 s to 10 s.";
  const VALID_C2 = "Testers reproduced one disengage per fight after the cooldown change.";

  function validDraft(): SynthesisDraft {
    return {
      summary: "P42 raised Scout dash cooldown and reduced disengages.",
      claims: [
        { claim_id: "C1", text: VALID_C1, material: true },
        { claim_id: "C2", text: VALID_C2, material: true }
      ],
      claim_evidence_links: [
        { claim_id: "C1", evidence_id: "E001", relation: "supports" },
        { claim_id: "C2", evidence_id: "E003", relation: "supports" }
      ]
    };
  }

  it("accepts a fully supported draft and reports claim_coverage 1", () => {
    const { request, evidence } = p42Fixture();

    const finding = validateSynthesisDraft(validDraft(), request, evidence);

    expect(finding).not.toBeNull();
    expect(finding).toMatchObject({
      material_claim_count: 2,
      supported_material_claim_count: 2,
      unsupported_material_claim_count: 0,
      claim_coverage: 1
    });
    expect(GameLogFindingSchema.safeParse(finding).success).toBe(true);
  });

  it("rejects non-contiguous claim ids", () => {
    const { request, evidence } = p42Fixture();
    const draft = validDraft();
    draft.claims[1] = { ...draft.claims[1], claim_id: "C3" };
    draft.claim_evidence_links[1] = { ...draft.claim_evidence_links[1], claim_id: "C3" };

    expect(validateSynthesisDraft(draft, request, evidence)).toBeNull();
  });

  it("rejects a link to evidence outside the returned set", () => {
    const { request, evidence } = p42Fixture();
    const draft = validDraft();
    draft.claim_evidence_links.push({
      claim_id: "C1",
      evidence_id: "E005",
      relation: "supports"
    });

    expect(validateSynthesisDraft(draft, request, evidence)).toBeNull();
  });

  it("rejects untrusted evidence linked with a non-untrusted_data relation", () => {
    // Widen the scope so the untrusted E009 lands in the returned evidence set.
    const request = makeP42Request({
      scope: { project_ids: ["Alpha"], entity_ids: ["ImportedNote", "P42", "Scout"] }
    });
    const evidence = retrieveEvidence(request);
    expect(evidence.some((item) => item.evidence_id === "E009")).toBe(true);

    const draft = validDraft();
    draft.claim_evidence_links.push({
      claim_id: "C1",
      evidence_id: "E009",
      relation: "supports"
    });

    expect(validateSynthesisDraft(draft, request, evidence)).toBeNull();
  });

  it("rejects supersedes without a matching supports link plus prior context", () => {
    const { request, evidence } = p42Fixture();

    // Superseding evidence carries supports, but no prior context_only/contradicts link.
    const noContext = validDraft();
    noContext.claim_evidence_links.push({
      claim_id: "C1",
      evidence_id: "E001",
      relation: "supersedes"
    });
    expect(validateSynthesisDraft(noContext, request, evidence)).toBeNull();

    // Superseding evidence never carries its own supports link.
    const noSupports = validDraft();
    noSupports.claim_evidence_links.push(
      { claim_id: "C1", evidence_id: "E003", relation: "supersedes" },
      { claim_id: "C1", evidence_id: "E002", relation: "context_only" }
    );
    expect(validateSynthesisDraft(noSupports, request, evidence)).toBeNull();
  });

  it("rejects a claim whose numeric transition contradicts its direction verb", () => {
    const { request, evidence } = p42Fixture();
    const draft = validDraft();
    // "reduced ... from 8 s to 10 s" is an impossible decrease.
    draft.claims[0] = {
      ...draft.claims[0],
      text: "P42 reduced Scout dash cooldown from 8 s to 10 s."
    };

    expect(validateSynthesisDraft(draft, request, evidence)).toBeNull();
  });
});

describe("runGenkitSearch without GEMINI_API_KEY", () => {
  it("streams the full frame sequence and terminates synthesis_unavailable/synthesis_503 with evidence preserved", async () => {
    const request = makeP42Request();

    const response = runGenkitSearch(request, new AbortController().signal);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/x-ndjson; charset=utf-8");

    const rawFrames = await readNdjsonFrames(response);
    const frames = parseFrames(rawFrames);

    expect(frames.map((frame) => frame.frame_type)).toEqual([
      "dispatch_accepted",
      "stage",
      "stage",
      "evidence_snapshot",
      "stage",
      "terminal"
    ]);
    expect(
      frames.flatMap((frame) => (frame.frame_type === "stage" ? [frame.stage] : []))
    ).toEqual(["retrieving", "ranking", "synthesizing"]);

    const snapshot = frames.find((frame) => frame.frame_type === "evidence_snapshot");
    const terminal = frames.find((frame) => frame.frame_type === "terminal");
    expect(snapshot).toBeDefined();
    expect(terminal).toBeDefined();
    if (snapshot?.frame_type !== "evidence_snapshot" || terminal?.frame_type !== "terminal") {
      throw new Error("unreachable: frame narrowing failed");
    }

    expect(terminal.outcome).toBe("synthesis_unavailable");
    expect(terminal.boundary_reason_code).toBe("synthesis_503");
    expect(terminal.failure_owner).toBe("synthesis");
    expect(terminal.recovery_action).toBe("open_raw_evidence");
    expect(terminal.finding).toBeNull();
    expect(terminal.query_id).toBe(QUERY_ID);
    expect(terminal.correlation_id).toBe(CORRELATION_ID);

    // Evidence retrieved before the synthesis failure is preserved verbatim.
    expect(terminal.evidence.map((item) => item.evidence_id)).toEqual(["E001", "E003", "E002"]);
    expect(terminal.evidence).toEqual(snapshot.evidence);
    expect(terminal.retrieved_evidence_set_hash).toBe(snapshot.retrieved_evidence_set_hash);
    expect(terminal.retrieved_evidence_set_hash).toBe(evidenceSetHash(terminal.evidence));
  });

  it("terminates no_hits with empty evidence and no evidence_snapshot frame", async () => {
    const request = makeRequest({ query_text: "zzz qqq unrelated topic" });

    const response = runGenkitSearch(request, new AbortController().signal);
    const frames = parseFrames(await readNdjsonFrames(response));

    expect(frames.map((frame) => frame.frame_type)).toEqual([
      "dispatch_accepted",
      "stage",
      "stage",
      "terminal"
    ]);
    expect(
      frames.flatMap((frame) => (frame.frame_type === "stage" ? [frame.stage] : []))
    ).toEqual(["retrieving", "ranking"]);

    const terminal = frames.at(-1);
    if (terminal?.frame_type !== "terminal") {
      throw new Error("unreachable: last frame is not terminal");
    }
    expect(terminal.outcome).toBe("no_hits");
    expect(terminal.boundary_reason_code).toBe("no_indexed_match");
    expect(terminal.evidence).toEqual([]);
    expect(terminal.retrieved_evidence_set_hash).toBeNull();
  });
});

describe("createGenkitHealth without GEMINI_API_KEY", () => {
  it("reports overall offline with genkit engine, ready retrieval, and offline synthesis", () => {
    const health = createGenkitHealth();

    expect(health.overall).toBe("offline");
    expect(health.engine).toBe("genkit");
    expect(health.retrieval.status).toBe("ready");
    expect(health.synthesis.status).toBe("offline");
    expect(health.synthesis.reason_code).toBe("synthesis_api_key_unconfigured");
    expect(health.index_snapshot_id).toBe(SIM_INDEX_SNAPSHOT_ID);
    expect(health.model_profile_id).toBeNull();
    expect(GameLogSearchHealthSchema.safeParse(health).success).toBe(true);
  });
});
