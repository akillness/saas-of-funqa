import { describe, expect, it } from "vitest";

import { resolveFrameTimecodes } from "./video-frames";

// `extractVideoFrames` needs a DOM, a decoder and a canvas, none of which exist
// in the node test environment. The selection rules are the part that can be
// wrong silently, so they live in a pure helper and are covered here.

describe("even-spacing request (existing API)", () => {
  it("keeps the original evenly spaced midpoints", () => {
    expect(resolveFrameTimecodes(4, 100)).toEqual([12.5, 37.5, 62.5, 87.5]);
    expect(resolveFrameTimecodes(1, 100)).toEqual([50]);
  });

  it("never seeks past the end of the video", () => {
    for (const timecode of resolveFrameTimecodes(8, 3)) {
      expect(timecode).toBeLessThanOrEqual(3 - 0.05);
      expect(timecode).toBeGreaterThanOrEqual(0);
    }
  });

  it("falls back to a single frame when the duration is unknown", () => {
    expect(resolveFrameTimecodes(6, 0)).toEqual([0]);
    expect(resolveFrameTimecodes(6, Number.POSITIVE_INFINITY)).toEqual([0]);
    expect(resolveFrameTimecodes(6, Number.NaN)).toEqual([0]);
  });

  it("treats a non-positive count as one frame", () => {
    expect(resolveFrameTimecodes(0, 100)).toEqual([50]);
    expect(resolveFrameTimecodes(-3, 100)).toEqual([50]);
  });
});

describe("explicit timecode request", () => {
  it("returns the requested seconds, sorted", () => {
    expect(resolveFrameTimecodes({ timecodesSec: [57, 9.839, 36.02] }, 100)).toEqual([
      9.84, 36.02, 57
    ]);
  });

  it("clamps into the seekable range instead of failing the seek", () => {
    expect(resolveFrameTimecodes({ timecodesSec: [-5, 250] }, 100)).toEqual([0, 99.95]);
  });

  it("dedupes seconds that collapse to the same frame", () => {
    // Three analysis events pointing at the same evidence frame cost one seek.
    expect(resolveFrameTimecodes({ timecodesSec: [21, 21.0, 21.004, 20.6] }, 93.6)).toEqual([
      20.6, 21
    ]);
    // Clamping can also create duplicates at the boundaries.
    expect(resolveFrameTimecodes({ timecodesSec: [-1, -2, 500, 600] }, 100)).toEqual([0, 99.95]);
  });

  it("drops values that are not usable numbers", () => {
    const requested = [Number.NaN, Number.POSITIVE_INFINITY, 12.5, null, "30"] as number[];
    expect(resolveFrameTimecodes({ timecodesSec: requested }, 100)).toEqual([12.5]);
  });

  it("returns nothing when no timecode survives, rather than inventing one", () => {
    expect(resolveFrameTimecodes({ timecodesSec: [] }, 100)).toEqual([]);
    expect(resolveFrameTimecodes({ timecodesSec: [Number.NaN] }, 100)).toEqual([]);
  });

  it("collapses to the first frame when the duration is unknown", () => {
    expect(resolveFrameTimecodes({ timecodesSec: [10, 20] }, 0)).toEqual([0]);
  });
});
