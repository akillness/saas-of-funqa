import { describe, expect, it } from "vitest";
import { getMonitoringSummary, recordRequest } from "./monitoring.service.js";

describe("instance monitoring summary", () => {
  it("reports missing observations as unknown rather than invented success and latency", () => {
    expect(getMonitoringSummary()).toMatchObject({
      scope: "instance",
      totalRequestsDay: 0,
      totalRequestsWeek: 0,
      successRate: null,
      p95LatencyMs: null,
      dailyCostUsd: 0,
      dailySavingsUsd: 0
    });
  });

  it("calculates p95 from the observed request population", () => {
    for (let latencyMs = 1; latencyMs <= 20; latencyMs += 1) {
      recordRequest(latencyMs, 10, latencyMs === 20);
    }

    expect(getMonitoringSummary()).toMatchObject({
      scope: "instance",
      totalRequestsDay: 20,
      successRate: 0.95,
      p95LatencyMs: 19,
      totalTokensDay: 200
    });
  });
});
