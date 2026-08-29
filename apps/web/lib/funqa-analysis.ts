// ---------------------------------------------------------------------------
// Parse and normalise a real FunQA per-video analysis JSON into frame evidence.
//
// The archive (`data/자료 (1).zip`, see scripts/load-video-corpus.mjs) ships one
// analysis file per video. Every file carries the same envelope —
// `video` / `preflight` / `modeT` / `modeP` — but only one of the two analysis
// modes is populated, and the two describe completely different things:
//
//   mode T ("timeline"): `modeT.segments[]`, contiguous spans with a Korean
//     `caption`, a `kind` (gameplay / cinematic / menu / logo / text_card) and
//     `sampleSec[]` frames the analyser actually looked at.
//   mode P ("point"): `modeP.events[]`, instants with `rawLabel`,
//     `interaction`, `abstractClass` and `evidenceTimestamps[]`. In the shipped
//     archive 365 of 541 events carry an EMPTY `evidence` string, and many
//     events share one identical evidence window.
//
// This module turns either shape into the same `FrameEvidence[]`, so a caller
// can ask the browser for exactly those timecodes (see `./video-frames`) and
// pair each returned image with the sentence the analyser wrote about it.
//
// Two failure modes drove the design and are guarded explicitly:
//
//   1. Pairing an analysis with the wrong video file silently produces
//      confident nonsense, so id / filename / duration are checked up front and
//      a mismatch throws instead of degrading.
//   2. Naively taking the first N events drops whole videos: `rhythm-runion`
//      has 348 events clustered in bursts and `platformer-poingpoing` has no
//      event at all before 27s of a 469s video. Selection is therefore spread
//      deterministically across the duration rather than truncated.
// ---------------------------------------------------------------------------

export type AnalysisMode = "T" | "P";

/** One frame the caller should extract, plus what the analysis says about it. */
export type FrameEvidence = {
  /** Stable, deterministic identity: `${videoId}:${mode}:${sourceIndex}`. */
  id: string;
  sourceMode: AnalysisMode;
  /** mode T: segment `kind`. mode P: the group's primary `interaction`. */
  sourceKind: string;
  /** Exact second to grab the representative frame at. */
  timecodeSec: number;
  startSec: number;
  endSec: number;
  /** Concise, whitespace-collapsed, length-capped analyst text. */
  evidenceText: string;
  /**
   * True when the analysis carried no prose and `evidenceText` was built from
   * labels alone. The caller must not present that string as an observation.
   */
  evidenceTextIsLabelOnly: boolean;
  /** Union of abstract classes, interactions and raw labels, deduped. */
  labels: string[];
  abstractClasses: string[];
  /** mode P only; empty for mode T. */
  interactions: string[];
  /** mode P only; empty for mode T. */
  rawLabels: string[];
  confidence: number | null;
  /** Which analysis file this pair came from. */
  analysisFilename: string;
};

export type FunqaAnalysisVideo = {
  id: string;
  filename: string;
  durationSec: number;
  genreHint: string | null;
};

export type ParsedFunqaAnalysis = {
  analysisFilename: string;
  video: FunqaAnalysisVideo;
  mode: AnalysisMode;
  analyzedAt: string | null;
  engine: string | null;
  /** Every meaningful candidate, ordered by timecode then source index. */
  candidates: FrameEvidence[];
  /** Sources dropped as zero-content, for honest reporting. */
  skippedCount: number;
};

export class FunqaAnalysisError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "FunqaAnalysisError";
    this.code = code;
  }
}

/** Prefix marking text that was synthesised from labels, not observed prose. */
export const LABEL_ONLY_PREFIX = "labels only:";

/** Evidence text is trimmed to this many characters. */
export const MAX_EVIDENCE_TEXT_LENGTH = 240;
const MAX_EVIDENCE_LABELS = 16;
const MAX_EVIDENCE_LABEL_LENGTH = 80;
const MAX_VIDEO_ID_LENGTH = 114;
const SAFE_VIDEO_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Slack, in seconds, allowed when deciding whether a mode P event belongs to an
 * already-open evidence window. Events in one burst share an identical
 * `evidenceTimestamps` array while their own `atSec` drifts a few hundred
 * milliseconds either side of it.
 */
const GROUP_TIME_SLACK_SEC = 0.5;

/** Seconds subtracted from the duration so a seek never lands past the end. */
const END_GUARD_SEC = 0.05;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** Collapse whitespace and cap length so one pair stays readable in a list. */
function concise(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= MAX_EVIDENCE_TEXT_LENGTH) return collapsed;
  return `${collapsed.slice(0, MAX_EVIDENCE_TEXT_LENGTH - 1).trimEnd()}…`;
}

function dedupe(values: (string | null | undefined)[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function boundedLabel(value: string | null): string | null {
  return value ? value.slice(0, MAX_EVIDENCE_LABEL_LENGTH) : null;
}

function boundedLabels(values: (string | null | undefined)[]): string[] {
  return dedupe(
    values.map((value) => boundedLabel(typeof value === "string" ? value : null))
  ).slice(0, MAX_EVIDENCE_LABELS);
}

function normaliseTimestamp(value: unknown): string | null {
  const raw = asNonEmptyString(value);
  if (!raw) return null;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

// --- filename matching -----------------------------------------------------

/**
 * Normalise a filename for comparison: drop any directory component, trim, and
 * fold case and Unicode form.
 *
 * The archive stores Korean directory names in CP949, so paths are unreliable
 * while basenames are ASCII in every case; macOS hands back NFD filenames from
 * a file picker while the JSON holds NFC.
 */
export function normaliseVideoFilename(filename: string): string {
  const basename = filename.split(/[\\/]/).pop() ?? "";
  return basename.trim().normalize("NFC").toLowerCase();
}

/**
 * Exact filename match.
 *
 * Deliberately strict: a differing extension or a stem-only overlap
 * (`Rhythm_Axion` vs `Rhythm_Axion.mp4`) is a mismatch, because pairing an
 * analysis with a near-miss file is exactly the silent-nonsense case this
 * module exists to prevent.
 */
export function matchesVideoFilename(left: string, right: string): boolean {
  const a = normaliseVideoFilename(left);
  const b = normaliseVideoFilename(right);
  return a.length > 0 && a === b;
}

/** Duration tolerance: container rounding differs from the analyser's probe. */
function durationToleranceSec(durationSec: number): number {
  return Math.max(1, durationSec * 0.02);
}

// --- parsing ---------------------------------------------------------------

function parseVideo(raw: unknown): FunqaAnalysisVideo {
  const video = asRecord(raw);
  if (!video) {
    throw new FunqaAnalysisError("video-missing", "analysis has no `video` object");
  }

  const id = asNonEmptyString(video.id);
  if (!id || id.length > MAX_VIDEO_ID_LENGTH || !SAFE_VIDEO_ID.test(id)) {
    throw new FunqaAnalysisError(
      "video-id-invalid",
      "analysis `video.id` must start with an ASCII letter or digit and contain only letters, digits, dot, underscore, or hyphen"
    );
  }

  const filename = asNonEmptyString(video.filename);
  if (!filename || filename.length > 240) {
    throw new FunqaAnalysisError(
      "video-filename-invalid",
      `analysis \`video.filename\` must be 1-240 characters (id ${id})`
    );
  }

  const durationSec = video.durationSec;
  if (!isFiniteNumber(durationSec) || durationSec <= 0) {
    throw new FunqaAnalysisError(
      "video-duration-invalid",
      `analysis \`video.durationSec\` must be a positive number (id ${id})`
    );
  }

  return {
    id,
    filename,
    durationSec,
    genreHint: asNonEmptyString(video.genreHint)
  };
}

function resolveMode(
  preflight: Record<string, unknown> | null,
  root: Record<string, unknown>
): AnalysisMode {
  const declared = asNonEmptyString(preflight?.mode)?.toUpperCase();
  if (declared === "T" || declared === "P") return declared;

  // The archive always declares a mode, but infer rather than reject when a
  // hand-built file omits it and only one side carries data.
  const hasSegments = Array.isArray(asRecord(root.modeT)?.segments);
  const hasEvents = Array.isArray(asRecord(root.modeP)?.events);
  if (hasSegments && !hasEvents) return "T";
  if (hasEvents && !hasSegments) return "P";

  throw new FunqaAnalysisError(
    "mode-unresolved",
    'analysis `preflight.mode` must be "T" or "P" and could not be inferred'
  );
}

/**
 * Clamp a second into the seekable range of the video.
 * Returns null when the input is not a usable number.
 */
function clampToVideo(value: unknown, durationSec: number): number | null {
  if (!isFiniteNumber(value)) return null;
  const upper = Math.max(0, durationSec - END_GUARD_SEC);
  return round(Math.min(Math.max(value, 0), upper));
}

function parseConfidence(value: unknown): number | null {
  return isFiniteNumber(value) ? round(Math.min(1, Math.max(0, value)), 4) : null;
}

// --- mode T ----------------------------------------------------------------

/**
 * Turn `modeT.segments[]` into candidates.
 *
 * Every kind is kept — menus, cinematics, logos and text cards are legitimate
 * answers to "where does the tutorial text appear" — and a segment is dropped
 * only when it is genuinely zero-content: no caption AND no abstract class.
 *
 * The representative frame is `sampleSec[0]` when that second actually falls
 * inside the segment (it is the frame the analyser captioned), otherwise the
 * segment midpoint.
 */
function collectModeTCandidates(
  root: Record<string, unknown>,
  video: FunqaAnalysisVideo,
  analysisFilename: string
): { candidates: FrameEvidence[]; skippedCount: number } {
  const modeT = asRecord(root.modeT);
  const segments = Array.isArray(modeT?.segments) ? (modeT.segments as unknown[]) : null;
  if (!segments) {
    throw new FunqaAnalysisError(
      "segments-missing",
      `mode T analysis has no \`modeT.segments\` array (id ${video.id})`
    );
  }

  const candidates: FrameEvidence[] = [];
  let skippedCount = 0;

  segments.forEach((entry, position) => {
    const segment = asRecord(entry);
    if (!segment) {
      skippedCount += 1;
      return;
    }

    const startSec = clampToVideo(segment.startSec, video.durationSec);
    const rawEnd = isFiniteNumber(segment.endSec) ? segment.endSec : null;
    if (startSec === null || rawEnd === null) {
      skippedCount += 1;
      return;
    }
    const endSec = clampToVideo(Math.max(rawEnd, startSec), video.durationSec) ?? startSec;

    const caption = asNonEmptyString(segment.caption);
    const abstractClasses = boundedLabels([
      ...(Array.isArray(segment.abstractClasses) ? (segment.abstractClasses as unknown[]) : []).map(
        (value) => (typeof value === "string" ? value : null)
      ),
      typeof segment.abstractClass === "string" ? segment.abstractClass : null
    ]);

    // Zero content: nothing was observed and nothing was classified. Anything
    // else — an unclassified cinematic with a caption, a classified span with
    // no caption — still answers a question and is kept.
    if (!caption && abstractClasses.length === 0) {
      skippedCount += 1;
      return;
    }

    const sampleRaw = Array.isArray(segment.sampleSec) ? (segment.sampleSec as unknown[])[0] : null;
    const sampleInRange =
      isFiniteNumber(sampleRaw) && sampleRaw >= startSec - 0.001 && sampleRaw <= endSec + 0.001;
    const timecodeSec = sampleInRange
      ? (clampToVideo(sampleRaw, video.durationSec) ?? startSec)
      : (clampToVideo((startSec + endSec) / 2, video.durationSec) ?? startSec);

    const kind = boundedLabel(asNonEmptyString(segment.kind)) ?? "unknown";
    const index = isFiniteNumber(segment.index) ? segment.index : position;

    candidates.push({
      id: `${video.id}:T:${index}`,
      sourceMode: "T",
      sourceKind: kind,
      timecodeSec,
      startSec,
      endSec,
      evidenceText: caption
        ? concise(caption)
        : `${LABEL_ONLY_PREFIX} ${kind} (${abstractClasses.join(", ")})`,
      evidenceTextIsLabelOnly: !caption,
      labels: boundedLabels([...abstractClasses, kind]),
      abstractClasses,
      interactions: [],
      rawLabels: [],
      confidence: parseConfidence(segment.confidence),
      analysisFilename
    });
  });

  return { candidates, skippedCount };
}

// --- mode P ----------------------------------------------------------------

type ModePEvent = {
  index: number;
  atSec: number;
  rawLabel: string | null;
  interaction: string | null;
  abstractClass: string | null;
  evidence: string | null;
  evidenceTimestamps: number[];
  confidence: number | null;
};

/**
 * Build the honest label-only sentence for a group with no analyst prose.
 *
 * 365 of the 541 shipped events have `evidence: ""`. Dropping them would delete
 * most of every mode P video, and inventing a description would be a lie, so
 * the labels are restated as labels and flagged via `evidenceTextIsLabelOnly`.
 */
function buildLabelOnlyText(
  interactions: string[],
  rawLabels: string[],
  abstractClasses: string[]
): string {
  const parts: string[] = [];
  if (interactions.length > 0) parts.push(interactions.join(" / "));
  if (rawLabels.length > 0) parts.push(rawLabels.join(", "));
  const head = parts.join(" ") || "unlabelled event";
  const tail = abstractClasses.length > 0 ? ` (${abstractClasses.join(", ")})` : "";
  return concise(`${LABEL_ONLY_PREFIX} ${head}${tail}`);
}

function readModePEvents(root: Record<string, unknown>, video: FunqaAnalysisVideo): ModePEvent[] {
  const modeP = asRecord(root.modeP);
  const events = Array.isArray(modeP?.events) ? (modeP.events as unknown[]) : null;
  if (!events) {
    throw new FunqaAnalysisError(
      "events-missing",
      `mode P analysis has no \`modeP.events\` array (id ${video.id})`
    );
  }

  const parsed: ModePEvent[] = [];
  events.forEach((entry, position) => {
    const event = asRecord(entry);
    if (!event) return;
    const atSec = clampToVideo(event.atSec, video.durationSec);
    if (atSec === null) return;

    const timestamps = (
      Array.isArray(event.evidenceTimestamps) ? (event.evidenceTimestamps as unknown[]) : []
    )
      .map((value) => clampToVideo(value, video.durationSec))
      .filter((value): value is number => value !== null);

    parsed.push({
      index: isFiniteNumber(event.k) ? event.k : position,
      atSec,
      rawLabel: boundedLabel(asNonEmptyString(event.rawLabel)),
      interaction: boundedLabel(asNonEmptyString(event.interaction)),
      abstractClass: boundedLabel(asNonEmptyString(event.abstractClass)),
      evidence: asNonEmptyString(event.evidence),
      evidenceTimestamps: [...new Set(timestamps)].sort((a, b) => a - b),
      confidence: parseConfidence(event.confidence)
    });
  });

  return parsed.sort((a, b) => a.atSec - b.atSec || a.index - b.index);
}

/**
 * Merge events that describe the same moment.
 *
 * A burst of events shares one identical `evidenceTimestamps` window — eight
 * `rhythm-axion` events all point at frames [20.6, 21, 21.4] — so extracting a
 * frame per event would return the same picture eight times. Events join an
 * open group when their evidence window is identical AND their own `atSec`
 * falls inside that window (plus a small slack); everything else opens a new
 * group. Events with no window at all group on their rounded second.
 */
function groupModePEvents(events: ModePEvent[]): ModePEvent[][] {
  const groups: ModePEvent[][] = [];
  const openBySignature = new Map<string, number>();

  for (const event of events) {
    const signature =
      event.evidenceTimestamps.length > 0
        ? `w:${event.evidenceTimestamps.join(",")}`
        : `t:${round(event.atSec, 1)}`;

    const openIndex = openBySignature.get(signature);
    if (openIndex !== undefined) {
      const group = groups[openIndex];
      const window = group[0].evidenceTimestamps;
      const low = (window.length > 0 ? window[0] : group[0].atSec) - GROUP_TIME_SLACK_SEC;
      const high =
        (window.length > 0 ? window[window.length - 1] : group[0].atSec) + GROUP_TIME_SLACK_SEC;
      if (event.atSec >= low && event.atSec <= high) {
        group.push(event);
        continue;
      }
    }

    openBySignature.set(signature, groups.length);
    groups.push([event]);
  }

  return groups;
}

function collectModePCandidates(
  root: Record<string, unknown>,
  video: FunqaAnalysisVideo,
  analysisFilename: string
): { candidates: FrameEvidence[]; skippedCount: number } {
  const events = readModePEvents(root, video);
  const groups = groupModePEvents(events);

  const candidates: FrameEvidence[] = [];
  let skippedCount = 0;

  for (const group of groups) {
    const rawLabels = dedupe(group.map((event) => event.rawLabel));
    const interactions = dedupe(group.map((event) => event.interaction));
    const abstractClasses = dedupe(group.map((event) => event.abstractClass));
    const prose = dedupe(group.map((event) => event.evidence));

    // Only a group with no prose AND no labels of any kind is truly empty.
    if (
      prose.length === 0 &&
      rawLabels.length === 0 &&
      interactions.length === 0 &&
      abstractClasses.length === 0
    ) {
      skippedCount += group.length;
      continue;
    }

    const window = group[0].evidenceTimestamps;
    const moments = [
      ...group.map((event) => event.atSec),
      ...group.flatMap((e) => e.evidenceTimestamps)
    ];
    const startSec = round(Math.min(...moments));
    const endSec = round(Math.max(...moments));

    // The first evidence timestamp is the frame the analyser actually scored;
    // fall back to the earliest event instant when no window was recorded.
    const timecodeSec = window.length > 0 ? window[0] : group[0].atSec;

    const anchor = group[0];
    candidates.push({
      id: `${video.id}:P:${anchor.index}`,
      sourceMode: "P",
      // The strongest single interaction in the burst; ties keep source order.
      sourceKind: interactions[0] ?? "unknown",
      timecodeSec,
      startSec,
      endSec,
      evidenceText:
        prose.length > 0
          ? concise(prose.join("; "))
          : buildLabelOnlyText(interactions, rawLabels, abstractClasses),
      evidenceTextIsLabelOnly: prose.length === 0,
      labels: boundedLabels([...abstractClasses, ...interactions, ...rawLabels]),
      abstractClasses,
      interactions,
      rawLabels,
      // A group is a union of independently asserted labels, not a
      // conjunction, so the strongest member represents it.
      confidence: group.reduce<number | null>(
        (best, event) =>
          event.confidence === null
            ? best
            : best === null
              ? event.confidence
              : Math.max(best, event.confidence),
        null
      ),
      analysisFilename
    });
  }

  return { candidates, skippedCount };
}

// --- public API ------------------------------------------------------------

/**
 * Parse one analysis file into normalised candidates.
 * Throws `FunqaAnalysisError` when the envelope is unusable.
 */
export function parseFunqaAnalysis(
  input: unknown,
  options: { analysisFilename: string }
): ParsedFunqaAnalysis {
  const root = asRecord(input);
  if (!root) {
    throw new FunqaAnalysisError("not-an-object", "analysis payload is not a JSON object");
  }

  const analysisFilename =
    normaliseVideoFilename(options.analysisFilename) || options.analysisFilename;
  if (!analysisFilename || analysisFilename.length > 255) {
    throw new FunqaAnalysisError(
      "analysis-filename-invalid",
      "analysis filename must be 1-255 characters"
    );
  }
  const video = parseVideo(root.video);
  const mode = resolveMode(asRecord(root.preflight), root);

  const collected =
    mode === "T"
      ? collectModeTCandidates(root, video, analysisFilename)
      : collectModePCandidates(root, video, analysisFilename);

  const candidates = collected.candidates
    .slice()
    .sort((a, b) => a.timecodeSec - b.timecodeSec || a.id.localeCompare(b.id));

  return {
    analysisFilename,
    video,
    mode,
    analyzedAt: normaliseTimestamp(root.analyzedAt),
    engine: asNonEmptyString(root.engine)?.slice(0, 80) ?? null,
    candidates,
    skippedCount: collected.skippedCount
  };
}

export type VideoIdentity = {
  filename: string;
  durationSec?: number | null;
  /** Optional: the `video.id` the caller believes it selected. */
  id?: string | null;
};

/**
 * Reject an analysis that does not belong to the selected video.
 *
 * Filename must match exactly; duration must agree within 2% (min 1s) of the
 * container's own report; an explicitly supplied id must match.
 */
export function assertAnalysisMatchesVideo(
  analysis: ParsedFunqaAnalysis,
  video: VideoIdentity
): void {
  if (!matchesVideoFilename(analysis.video.filename, video.filename)) {
    throw new FunqaAnalysisError(
      "filename-mismatch",
      `analysis is for "${analysis.video.filename}" but the selected file is "${video.filename}"`
    );
  }

  if (video.id != null && video.id.trim().length > 0 && video.id.trim() !== analysis.video.id) {
    throw new FunqaAnalysisError(
      "video-id-mismatch",
      `analysis id "${analysis.video.id}" does not match "${video.id}"`
    );
  }

  if (isFiniteNumber(video.durationSec)) {
    const tolerance = durationToleranceSec(analysis.video.durationSec);
    const delta = Math.abs(analysis.video.durationSec - video.durationSec);
    if (delta > tolerance) {
      throw new FunqaAnalysisError(
        "duration-mismatch",
        `analysis duration ${round(analysis.video.durationSec, 1)}s differs from the selected file's ` +
          `${round(video.durationSec, 1)}s by more than ${round(tolerance, 1)}s`
      );
    }
  }
}

/**
 * Pick at most `maxFrames` candidates, spread deterministically across the
 * video.
 *
 * The duration is split into `maxFrames` bins and the strongest candidate in
 * each bin wins; leftover slots are filled by confidence, then time, then id.
 * Taking the head of the list instead would return eight near-identical menu
 * frames from the first 30 seconds of `rhythm-runion` and nothing from
 * `platformer-poingpoing` before 27s.
 */
export function selectFrameEvidence(
  analysis: ParsedFunqaAnalysis,
  maxFrames: number
): FrameEvidence[] {
  const cap = Math.max(0, Math.floor(maxFrames));
  if (cap === 0) return [];
  const candidates = analysis.candidates;
  if (candidates.length <= cap) return candidates.slice();

  const duration = analysis.video.durationSec;
  const binWidth = duration / cap;
  const strength = (frame: FrameEvidence) => frame.confidence ?? -1;

  const bestByBin = new Map<number, FrameEvidence>();
  candidates.forEach((frame) => {
    const bin =
      binWidth > 0 ? Math.min(cap - 1, Math.max(0, Math.floor(frame.timecodeSec / binWidth))) : 0;
    const current = bestByBin.get(bin);
    if (
      !current ||
      strength(frame) > strength(current) ||
      (strength(frame) === strength(current) &&
        (frame.timecodeSec < current.timecodeSec ||
          (frame.timecodeSec === current.timecodeSec && frame.id.localeCompare(current.id) < 0)))
    ) {
      bestByBin.set(bin, frame);
    }
  });

  const selected = [...bestByBin.values()];
  if (selected.length < cap) {
    const chosen = new Set(selected.map((frame) => frame.id));
    const fillers = candidates
      .filter((frame) => !chosen.has(frame.id))
      .sort(
        (a, b) =>
          strength(b) - strength(a) || a.timecodeSec - b.timecodeSec || a.id.localeCompare(b.id)
      )
      .slice(0, cap - selected.length);
    selected.push(...fillers);
  }

  return selected
    .sort((a, b) => a.timecodeSec - b.timecodeSec || a.id.localeCompare(b.id))
    .slice(0, cap);
}

export type FrameEvidencePlan = {
  analysisFilename: string;
  video: FunqaAnalysisVideo;
  mode: AnalysisMode;
  analyzedAt: string | null;
  engine: string | null;
  frames: FrameEvidence[];
  /** Candidates considered before the cap was applied. */
  candidateCount: number;
  skippedCount: number;
  /** Exact seconds to hand to `extractVideoFrames`. */
  timecodesSec: number[];
};

/**
 * One-call path: parse, verify the analysis belongs to the selected video, and
 * return at most `maxFrames` frame-evidence pairs plus the timecodes to extract.
 */
export function buildFrameEvidencePlan(
  input: unknown,
  options: {
    analysisFilename: string;
    video: VideoIdentity;
    maxFrames: number;
  }
): FrameEvidencePlan {
  const analysis = parseFunqaAnalysis(input, { analysisFilename: options.analysisFilename });
  assertAnalysisMatchesVideo(analysis, options.video);
  const selected = selectFrameEvidence(analysis, options.maxFrames);
  const containerDuration = isFiniteNumber(options.video.durationSec)
    ? options.video.durationSec
    : analysis.video.durationSec;
  const upperBound = Math.max(
    0,
    Math.min(analysis.video.durationSec, containerDuration) - END_GUARD_SEC
  );
  const seenTimecodes = new Set<number>();
  const frames = selected.flatMap((frame) => {
    const timecodeSec = round(Math.min(frame.timecodeSec, upperBound));
    if (seenTimecodes.has(timecodeSec)) return [];
    seenTimecodes.add(timecodeSec);
    return [{ ...frame, timecodeSec }];
  });

  return {
    analysisFilename: analysis.analysisFilename,
    video: analysis.video,
    mode: analysis.mode,
    analyzedAt: analysis.analyzedAt,
    engine: analysis.engine,
    frames,
    candidateCount: analysis.candidates.length,
    skippedCount: analysis.skippedCount,
    timecodesSec: frames.map((frame) => frame.timecodeSec)
  };
}
