import { describe, expect, it } from "vitest";
import {
  DialogueExperimentTraceSchema,
  DialoguePolicySchema,
  GeneratedWorldTraceSchema,
  PlaySessionSchema,
  SimilarGameLinkSchema,
  TensionScoreLabelSchema,
  ValidationResultSchema,
  WorldStateSchema
} from "./index";

describe("WorldStateSchema", () => {
  it("parses a minimal world with defaulted collections", () => {
    const result = WorldStateSchema.parse({
      worldId: "fantasy-001",
      genre: "fantasy"
    });
    expect(result.locations).toEqual([]);
    expect(result.narrativeFacts).toEqual([]);
  });

  it("rejects an unknown genre", () => {
    expect(() =>
      WorldStateSchema.parse({ worldId: "w1", genre: "horror" })
    ).toThrow();
  });
});

describe("ValidationResultSchema", () => {
  it("requires a known error code", () => {
    expect(() =>
      ValidationResultSchema.parse({
        valid: false,
        errors: [{ code: "NOT_A_REAL_CODE", entity: "rusted_key", reason: "x" }]
      })
    ).toThrow();
  });

  it("accepts a valid unreachable-object error", () => {
    const result = ValidationResultSchema.parse({
      valid: false,
      errors: [
        {
          code: "UNREACHABLE_REQUIRED_OBJECT",
          entity: "rusted_key",
          reason: "locked behind the door it opens"
        }
      ]
    });
    expect(result.errors).toHaveLength(1);
  });
});

describe("GeneratedWorldTraceSchema", () => {
  it("parses a trace with a fixed systemVariant enum", () => {
    const result = GeneratedWorldTraceSchema.parse({
      worldId: "fantasy-001",
      genre: "fantasy",
      systemVariant: "neuro-symbolic",
      createdAt: new Date().toISOString()
    });
    expect(result.committedTransformations).toEqual([]);
  });
});

describe("DialoguePolicySchema and DialogueExperimentTraceSchema", () => {
  it("requires a nested personaState object", () => {
    expect(() =>
      DialoguePolicySchema.parse({
        npcId: "captain_mira",
        questStage: "investigate_smuggler_route"
      })
    ).toThrow();
  });

  it("parses a full dialogue experiment trace", () => {
    const policyPacket = DialoguePolicySchema.parse({
      npcId: "captain_mira",
      questStage: "investigate_smuggler_route",
      personaState: { dominant: "guarded_naval_veteran" }
    });
    const trace = DialogueExperimentTraceSchema.parse({
      scenarioId: "fantasy-guard-questhint-001",
      npcId: "captain_mira",
      playerUtterance: "What do you know about the lighthouse?",
      policyPacket
    });
    expect(trace.candidateResponses).toEqual([]);
    expect(trace.tokensUsed).toBe(0);
  });
});

describe("FunQA tension-score contracts", () => {
  it("parses a play session and tension score label", () => {
    const session = PlaySessionSchema.parse({
      sessionId: "s1",
      gameId: "g1",
      policyId: "p1",
      videoUrl: "https://example.com/v.mp4",
      durationSeconds: 120,
      recordedAt: new Date().toISOString()
    });
    expect(session.durationSeconds).toBe(120);

    const label = TensionScoreLabelSchema.parse({
      sessionId: "s1",
      timestampSeconds: 30,
      surveyMean: 0.7,
      surveyStdDev: 0.1,
      respondentCount: 12
    });
    expect(label.smoothingWindowSeconds).toBe(5);
  });

  it("rejects a similarity score outside [0, 1]", () => {
    expect(() =>
      SimilarGameLinkSchema.parse({
        gameId: "g1",
        similarGameId: "g2",
        similarityScore: 1.5
      })
    ).toThrow();
  });
});
