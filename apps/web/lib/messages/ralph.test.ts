import { describe, expect, it } from "vitest";
import { enMessages } from "./en";
import { koMessages } from "./ko";

type MessageNode = string | number | boolean | readonly MessageNode[] | { readonly [key: string]: MessageNode };

const REQUIRED_RALPH_SHAPE_PATHS = [
  "$",
  "$.evidenceColumns",
  "$.evidenceColumns.artifact",
  "$.evidenceColumns.purpose",
  "$.evidenceColumns.state",
  "$.evidenceEyebrow",
  "$.evidenceRows",
  "$.evidenceRows[]",
  "$.evidenceRows[].artifact",
  "$.evidenceRows[].purpose",
  "$.evidenceRows[].state",
  "$.evidenceTitle",
  "$.eyebrow",
  "$.guardrails",
  "$.guardrailsEyebrow",
  "$.guardrailsTitle",
  "$.guardrails[]",
  "$.handoffAction",
  "$.handoffBody",
  "$.handoffEyebrow",
  "$.handoffQuery",
  "$.handoffTitle",
  "$.lede",
  "$.loopEyebrow",
  "$.loopLede",
  "$.loopSteps",
  "$.loopSteps[]",
  "$.loopSteps[].body",
  "$.loopSteps[].label",
  "$.loopSteps[].signal",
  "$.loopSteps[].title",
  "$.loopTitle",
  "$.primaryAction",
  "$.secondaryAction",
  "$.statusCard",
  "$.statusCard.eyebrow",
  "$.statusCard.metrics",
  "$.statusCard.metrics[]",
  "$.statusCard.metrics[].label",
  "$.statusCard.metrics[].text",
  "$.statusCard.metrics[].value",
  "$.statusCard.title",
  "$.title"
].sort();

function collectShapePaths(value: MessageNode, prefix = "$"): string[] {
  if (Array.isArray(value)) {
    const paths = new Set<string>([prefix]);

    for (const item of value) {
      for (const childPath of collectShapePaths(item, `${prefix}[]`)) {
        paths.add(childPath);
      }
    }

    return [...paths].sort();
  }

  if (value !== null && typeof value === "object") {
    const paths = new Set<string>([prefix]);

    for (const [key, child] of Object.entries(value)) {
      for (const childPath of collectShapePaths(child, `${prefix}.${key}`)) {
        paths.add(childPath);
      }
    }

    return [...paths].sort();
  }

  return [prefix];
}

function expectNonEmptyText(value: string) {
  expect(value.trim().length).toBeGreaterThan(0);
}

describe("Ralph page messages", () => {
  it("keeps Korean and English Ralph copy in recursive key parity", () => {
    expect(collectShapePaths(koMessages.ralph)).toEqual(collectShapePaths(enMessages.ralph));
  });

  it.each([
    ["en", enMessages.ralph],
    ["ko", koMessages.ralph]
  ] as const)("matches the required Ralph page key contract for %s", (_locale, copy) => {
    expect(collectShapePaths(copy)).toEqual(REQUIRED_RALPH_SHAPE_PATHS);
  });

  it.each([
    ["en", enMessages.ralph],
    ["ko", koMessages.ralph]
  ] as const)("defines complete %s entries for every Ralph page section", (_locale, copy) => {
    [
      copy.eyebrow,
      copy.title,
      copy.lede,
      copy.primaryAction,
      copy.secondaryAction,
      copy.loopEyebrow,
      copy.loopTitle,
      copy.loopLede,
      copy.guardrailsEyebrow,
      copy.guardrailsTitle,
      copy.evidenceEyebrow,
      copy.evidenceTitle,
      copy.handoffEyebrow,
      copy.handoffTitle,
      copy.handoffBody,
      copy.handoffAction,
      copy.handoffQuery,
      copy.statusCard.eyebrow,
      copy.statusCard.title,
      copy.evidenceColumns.artifact,
      copy.evidenceColumns.purpose,
      copy.evidenceColumns.state
    ].forEach(expectNonEmptyText);

    expect(copy.statusCard.metrics).toHaveLength(3);
    for (const metric of copy.statusCard.metrics) {
      expectNonEmptyText(metric.label);
      expectNonEmptyText(metric.value);
      expectNonEmptyText(metric.text);
    }

    expect(copy.loopSteps).toHaveLength(5);
    for (const step of copy.loopSteps) {
      expectNonEmptyText(step.label);
      expectNonEmptyText(step.title);
      expectNonEmptyText(step.body);
      expectNonEmptyText(step.signal);
    }

    expect(copy.guardrails).toHaveLength(4);
    copy.guardrails.forEach(expectNonEmptyText);

    expect(copy.evidenceRows).toHaveLength(5);
    for (const row of copy.evidenceRows) {
      expectNonEmptyText(row.artifact);
      expectNonEmptyText(row.purpose);
      expectNonEmptyText(row.state);
    }
  });
});
