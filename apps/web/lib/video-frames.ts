// Browser-side video frame extraction for the Scene Search lab.
// Draws evenly spaced frames of a user-selected video file onto a canvas and
// returns downscaled JPEG data URLs, so the raw video never leaves the browser.

export type ExtractedFrame = {
  timecodeSec: number;
  imageDataUrl: string;
};

const FRAME_MAX_WIDTH = 480;
const FRAME_JPEG_QUALITY = 0.72;

function waitForEvent(target: EventTarget, event: string, errorEvent = "error"): Promise<void> {
  return new Promise((resolve, reject) => {
    const onDone = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(`video ${errorEvent} while waiting for ${event}`));
    };
    const cleanup = () => {
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

export async function extractVideoFrames(file: File, frameCount: number): Promise<ExtractedFrame[]> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await waitForEvent(video, "loadedmetadata");
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

    const count = Math.max(1, frameCount);
    const usableDuration = duration > 0 ? duration : 0;
    const frames: ExtractedFrame[] = [];

    for (let index = 0; index < count; index += 1) {
      const timecodeSec =
        usableDuration > 0 ? ((index + 0.5) / count) * usableDuration : 0;

      if (usableDuration > 0) {
        video.currentTime = Math.min(timecodeSec, Math.max(0, usableDuration - 0.05));
        await waitForEvent(video, "seeked");
      }

      context.drawImage(video, 0, 0, width, height);
      frames.push({
        timecodeSec: Number(timecodeSec.toFixed(2)),
        imageDataUrl: canvas.toDataURL("image/jpeg", FRAME_JPEG_QUALITY)
      });

      if (usableDuration <= 0) {
        break;
      }
    }

    return frames;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
