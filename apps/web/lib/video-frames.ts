// Browser-side video frame extraction for the Scene Search lab.
// Draws frames of a user-selected video file onto a canvas and returns
// downscaled JPEG data URLs, so the raw video never leaves the browser.
//
// Two request shapes are supported:
//
//   extractVideoFrames(file, 8)                       evenly spaced (original)
//   extractVideoFrames(file, { timecodesSec: [...] })  exact seconds
//
// The second shape exists so a real analysis file can drive extraction:
// `buildFrameEvidencePlan` in `./funqa-analysis` returns the exact seconds the
// analyser captioned, and pairing its sentence with an evenly spaced frame
// taken somewhere else would attach the text to the wrong picture.

export type ExtractedFrame = {
  timecodeSec: number;
  imageDataUrl: string;
};

export type ExtractedVideoFrames = {
  durationSec: number;
  frames: ExtractedFrame[];
};

/** Either an evenly spaced frame count or explicit seconds to seek to. */
export type FrameRequest = number | { timecodesSec: number[] };

const FRAME_MAX_WIDTH = 480;
const FRAME_JPEG_QUALITY = 0.72;

/** Seconds kept clear of the end so a seek always lands on a decodable frame. */
const END_GUARD_SEC = 0.05;

function roundTimecode(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}

/**
 * Resolve a request into the exact, ordered seconds to seek to.
 *
 * Pure and DOM-free so the selection rules are testable without a browser.
 * Explicit timecodes are clamped into the seekable range, rounded to the
 * hundredth of a second (the precision the extractor reports anyway) and
 * deduped, so two analysis events that both point at 21.0s cost one seek
 * instead of two identical frames.
 */
export function resolveFrameTimecodes(request: FrameRequest, durationSec: number): number[] {
  const usableDuration = Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
  const upperBound = Math.max(0, usableDuration - END_GUARD_SEC);

  if (typeof request === "number") {
    const count = Math.max(1, Math.floor(request));
    if (usableDuration <= 0) return [0];
    return Array.from({ length: count }, (_, index) =>
      roundTimecode(Math.min(((index + 0.5) / count) * usableDuration, upperBound))
    );
  }

  const requested = Array.isArray(request?.timecodesSec) ? request.timecodesSec : [];
  const seen = new Set<number>();
  const resolved: number[] = [];

  for (const value of requested) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const clamped = roundTimecode(Math.min(Math.max(value, 0), upperBound));
    if (seen.has(clamped)) continue;
    seen.add(clamped);
    resolved.push(clamped);
  }

  return resolved.sort((a, b) => a - b);
}

const VIDEO_EVENT_TIMEOUT_MS = 15_000;

function waitForEvent(target: EventTarget, event: string, errorEvent = "error"): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(() => {
      cleanup();
      reject(new Error(`video timed out after ${VIDEO_EVENT_TIMEOUT_MS}ms waiting for ${event}`));
    }, VIDEO_EVENT_TIMEOUT_MS);
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`video ${errorEvent} while waiting for ${event}`));
    };
    const cleanup = () => {
      globalThis.clearTimeout(timeout);
      target.removeEventListener(event, onDone);
      target.removeEventListener(errorEvent, onError);
    };
    target.addEventListener(event, onDone, { once: true });
    target.addEventListener(errorEvent, onError, { once: true });
  });
}

async function resolveDuration(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  // MediaRecorder-produced WebM often reports Infinity until forced to seek.
  video.currentTime = Number.MAX_SAFE_INTEGER;
  await waitForEvent(video, "seeked");
  const duration = video.duration;
  video.currentTime = 0;
  await waitForEvent(video, "seeked");
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
}

export async function extractVideoFrames(
  file: File,
  request: FrameRequest
): Promise<ExtractedVideoFrames> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await waitForEvent(video, "loadedmetadata");
    if (video.readyState < 2) await waitForEvent(video, "loadeddata");
    const duration = await resolveDuration(video);
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error("video has no decodable frames");
    }

    const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
    const width = Math.max(2, Math.round(video.videoWidth * scale));
    const height = Math.max(2, Math.round(video.videoHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas 2d context unavailable");
    }

    const usableDuration = duration > 0 ? duration : 0;
    const timecodes = resolveFrameTimecodes(request, usableDuration);
    const frames: ExtractedFrame[] = [];

    for (const timecodeSec of timecodes) {
      if (usableDuration > 0) {
        video.currentTime = timecodeSec;
        await waitForEvent(video, "seeked");
      }

      context.drawImage(video, 0, 0, width, height);
      frames.push({
        timecodeSec,
        imageDataUrl: canvas.toDataURL("image/jpeg", FRAME_JPEG_QUALITY)
      });

      if (usableDuration <= 0) {
        break;
      }
    }

    return { durationSec: Number(duration.toFixed(2)), frames };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
