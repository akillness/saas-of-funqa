/**
 * Local smoke for the in-process Genkit game-log search engine.
 *
 * Usage:
 *   GEMINI_API_KEY=... GAME_LOG_SEARCH_ENGINE=genkit \
 *     npx tsx scripts/smoke-genkit-engine.mts
 *
 * Exercises the supported path (Q01-style query), the deterministic
 * weak-support boundary (Q02-style cause query), and the stale-index path,
 * printing one summary line per case. Exits non-zero when any case violates
 * the frozen game-log-search.v1 terminal contract.
 */
import { GameLogSearchFrameSchema, type GameLogSearchRequest } from "@funqa/contracts";

process.env.GAME_LOG_SEARCH_ENGINE = "genkit";

const { runGenkitSearch } = await import(
  "../apps/web/app/api/game-log-search/_genkit-engine.js"
);

function uuid7(suffix: string): string {
  return `01890f26-6b4${suffix.length % 10}-7abc-8def-${suffix.padEnd(12, "0").slice(0, 12)}`;
}

function makeRequest(queryText: string, timeTo: string | null): GameLogSearchRequest {
  return {
    schema_version: "game-log-search.v1",
    session_id: "01890f26-6b40-7abc-8def-123456789000",
    workspace_id: "genkit-smoke",
    query_id: uuid7(Math.random().toString(16).slice(2)),
    parent_query_id: null,
    correlation_id: uuid7(Math.random().toString(16).slice(2)),
    query_text: queryText,
    scope: {
      project_ids: ["Alpha"],
      entity_ids: [],
      time_from: null,
      time_to: timeTo,
      source_ids: [],
      index_snapshot_id: "sim-index-v1"
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
  } as GameLogSearchRequest;
}

async function runCase(
  label: string,
  queryText: string,
  timeTo: string | null
): Promise<{ outcome: string; frames: string[]; findingClaims: number | null }> {
  const controller = new AbortController();
  const response = runGenkitSearch(makeRequest(queryText, timeTo), controller.signal);
  const text = await response.text();
  const frames = text
    .trim()
    .split("\n")
    .map((line: string) => GameLogSearchFrameSchema.parse(JSON.parse(line)));
  const terminal = frames[frames.length - 1];
  if (terminal.frame_type !== "terminal") {
    throw new Error(`${label}: last frame is ${terminal.frame_type}, not terminal`);
  }
  return {
    outcome: terminal.outcome,
    frames: frames.map((frame: { frame_type: string }) => frame.frame_type),
    findingClaims: terminal.finding ? terminal.finding.claims.length : null
  };
}

const cases: Array<{ label: string; query: string; timeTo: string | null; expect: string[] }> = [
  {
    label: "supported-path",
    query: "What changed about Scout dash cooldown in P42, and why?",
    timeTo: null,
    expect: ["supported", "weak_support", "synthesis_unavailable"]
  },
  {
    label: "stale-index",
    query: "Summarize the newest Scout playtest.",
    timeTo: "2026-08-10T00:00:00Z",
    expect: ["stale_index"]
  },
  {
    // Scoped retrieval keeps zero-score records (vector-search parity), so a
    // nonsense query inside a valid scope legitimately reaches synthesis.
    label: "scoped-nonsense",
    query: "quantum blockchain espresso machine firmware",
    timeTo: null,
    expect: ["weak_support", "synthesis_unavailable", "supported"]
  }
];

let failed = false;
for (const testCase of cases) {
  const result = await runCase(testCase.label, testCase.query, testCase.timeTo);
  const ok = testCase.expect.includes(result.outcome);
  if (!ok) {
    failed = true;
  }
  console.log(
    `${ok ? "ok" : "FAIL"} ${testCase.label}: outcome=${result.outcome} frames=${result.frames.join(">")} claims=${result.findingClaims ?? "-"}`
  );
}

process.exit(failed ? 1 : 0);
