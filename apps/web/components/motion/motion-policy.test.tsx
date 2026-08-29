import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { AgentActivityOrb } from "@/components/motion/agent-activity-orb";
import { FocusBeam } from "@/components/motion/focus-beam";
import {
  MOTION_BUDGET,
  acquireMotionSlot,
  motionSlotsInUse,
  releaseMotionSlot,
  resetMotionBudget
} from "@/components/motion/motion-policy";

beforeEach(() => {
  resetMotionBudget();
});

describe("motion budget", () => {
  it("hands out exactly the budgeted number of slots per surface", () => {
    const budget = MOTION_BUDGET["agent-orb"];
    const grants = Array.from({ length: budget + 2 }, () => acquireMotionSlot("agent-orb"));

    expect(grants.filter(Boolean)).toHaveLength(budget);
    expect(grants.slice(budget)).toEqual([false, false]);
    expect(motionSlotsInUse("agent-orb")).toBe(budget);
  });

  it("keeps the focus accent to a single instance per page", () => {
    expect(MOTION_BUDGET["focus-beam"]).toBe(1);
    expect(acquireMotionSlot("focus-beam")).toBe(true);
    expect(acquireMotionSlot("focus-beam")).toBe(false);
  });

  it("returns a slot on release so a later mount can animate", () => {
    expect(acquireMotionSlot("focus-beam")).toBe(true);
    releaseMotionSlot("focus-beam");
    expect(motionSlotsInUse("focus-beam")).toBe(0);
    expect(acquireMotionSlot("focus-beam")).toBe(true);
  });

  it("never lets a stray release drive a surface negative", () => {
    releaseMotionSlot("agent-orb");
    releaseMotionSlot("agent-orb");
    expect(motionSlotsInUse("agent-orb")).toBe(0);
  });

  it("does not leak budget between surfaces", () => {
    acquireMotionSlot("focus-beam");
    expect(motionSlotsInUse("agent-orb")).toBe(0);
    expect(acquireMotionSlot("agent-orb")).toBe(true);
  });
});

describe("server rendering", () => {
  it("renders the agent orb as an inert static mark, never a canvas", () => {
    const markup = renderToStaticMarkup(
      createElement(AgentActivityOrb, { activity: "retrieving", active: true })
    );

    expect(markup).toContain('data-motion="static"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("<canvas");
    // The orb is decorative; the live region owns the wording.
    expect(markup).not.toContain("aria-label");
    expect(markup).not.toContain("role=");
  });

  it("keeps the wrapped control intact when the beam refuses to animate", () => {
    const markup = renderToStaticMarkup(
      <FocusBeam active>
        <button type="submit">Search</button>
      </FocusBeam>
    );

    expect(markup).toContain('data-motion="static"');
    expect(markup).toContain('<button type="submit">Search</button>');
    expect(markup).not.toContain("<style");
  });

  it("reports why motion was withheld so a static page is debuggable", () => {
    const inactive = renderToStaticMarkup(
      createElement(AgentActivityOrb, { activity: "ranking", active: false })
    );
    const active = renderToStaticMarkup(
      createElement(AgentActivityOrb, { activity: "ranking", active: true })
    );

    expect(inactive).toContain('data-reason="inactive"');
    expect(active).toContain('data-reason="reduced-motion"');
  });
});

describe("activity vocabulary", () => {
  it("covers every wire stage the search contract can emit", () => {
    const stages = ["retrieving", "ranking", "synthesizing"] as const;

    for (const stage of stages) {
      const markup = renderToStaticMarkup(
        createElement(AgentActivityOrb, { activity: stage, active: true })
      );
      expect(markup).toContain(`data-activity="${stage}"`);
    }

    // Plus the pre-stage state the wire cannot express: dispatch accepted,
    // no stage frame yet.
    expect(
      renderToStaticMarkup(
        createElement(AgentActivityOrb, { activity: "dispatching", active: true })
      )
    ).toContain('data-activity="dispatching"');
  });
});
