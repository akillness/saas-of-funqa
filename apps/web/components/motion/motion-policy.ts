"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Motion capability policy for FunQA.
 *
 * Source: the 2026-08-26 source audit of the four "viral" UI effect packages
 * (https://akillness.github.io/posts/viral-ui-effects-source-audit/). Its
 * conclusion is that the effects are not interchangeable decorations: each one
 * is a renderer with its own scheduler, instance cost, and accessibility
 * boundary. The audit's remedy is an adapter that owns the policy so that no
 * screen imports a third-party effect directly.
 *
 * This module is that adapter. It answers exactly one question — "may this
 * surface animate right now?" — and every caller must be able to render a
 * static fallback when the answer is no.
 *
 * Rules encoded here:
 *  1. Reduced motion is decided by the application, never by the library.
 *     `border-beam` only honours it for its pulse variants and `metal-fx` does
 *     not honour it at all, so the wrapper has to hold the switch.
 *  2. Every animated surface has an instance budget. Border Beam writes an
 *     ID-scoped `<style>` element per mount and Thinking Orbs schedules one RAF
 *     per visible orb, so both degrade by *count*, not by presence.
 *  3. The server renders the static version. Effects are client-only, and a
 *     canvas/WebGL renderer must never be part of the prerendered markup.
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Per-surface instance budget for a single page.
 *
 * `agent-orb`  — Thinking Orbs. Ten orbs share one phase clock but still
 *                schedule ten RAF callbacks, so a handful of concurrent agent
 *                indicators is fine and a scrolling log of them is not.
 * `focus-beam` — Border Beam. Each mount emits its own generated stylesheet
 *                (the audit measured ~72 KB of generated CSS text across seven
 *                mounts on the vendor demo), so this stays an accent on the
 *                primary control, not a row decoration.
 */
export const MOTION_BUDGET = {
  "agent-orb": 4,
  "focus-beam": 1
} as const;

export type MotionSurface = keyof typeof MOTION_BUDGET;

export type MotionDenialReason =
  /** The caller says this surface is not currently doing anything. */
  | "inactive"
  /** `prefers-reduced-motion: reduce`, or a render with no DOM (server). */
  | "reduced-motion"
  /** Client render before the budget claim effect has run. */
  | "pending"
  /** The page already spends its whole budget for this surface. */
  | "over-budget";

export type MotionDecision =
  | { animate: true; reason: null }
  | { animate: false; reason: MotionDenialReason };

const GRANTED: MotionDecision = { animate: true, reason: null };

function denied(reason: MotionDenialReason): MotionDecision {
  return { animate: false, reason };
}

function subscribeToMotionPreference(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * The server has no motion preference to read. Returning `true` means the
 * prerendered HTML is always the static variant, which keeps hydration honest
 * for users who do prefer reduced motion and keeps canvas renderers out of SSR.
 */
function readServerMotionPreference(): boolean {
  return true;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    readMotionPreference,
    readServerMotionPreference
  );
}

const claimedSlots = new Map<MotionSurface, number>();

/** Exported for tests and for debugging a page that unexpectedly went static. */
export function motionSlotsInUse(surface: MotionSurface): number {
  return claimedSlots.get(surface) ?? 0;
}

/** Exported for tests only — production code never resets a live budget. */
export function resetMotionBudget(): void {
  claimedSlots.clear();
}

/**
 * Take one animated slot for `surface`, or refuse.
 *
 * Exported because the budget is a property of the page, not of React: a
 * non-React renderer (a canvas overlay, a future WebGL surface) has to book
 * against the same ledger or the budget means nothing. Every successful
 * acquire must be paired with `releaseMotionSlot`.
 */
export function acquireMotionSlot(surface: MotionSurface): boolean {
  const used = motionSlotsInUse(surface);
  if (used >= MOTION_BUDGET[surface]) {
    return false;
  }
  claimedSlots.set(surface, used + 1);
  return true;
}

export function releaseMotionSlot(surface: MotionSurface): void {
  claimedSlots.set(surface, Math.max(0, motionSlotsInUse(surface) - 1));
}

/**
 * Decide whether one mounted surface may run its animated renderer.
 *
 * The decision is deliberately staged: the first client render is always
 * `pending` (static), and the budget claim happens in an effect so that the
 * slot is released on unmount. A surface that loses the race for the last slot
 * stays static for its whole lifetime instead of flickering between renderers.
 */
export function useMotionCapability(surface: MotionSurface, active = true): MotionDecision {
  const prefersReducedMotion = usePrefersReducedMotion();
  const wantsMotion = active && !prefersReducedMotion;
  const [slot, setSlot] = useState<"pending" | "granted" | "denied">("pending");

  useEffect(() => {
    if (!wantsMotion) {
      setSlot("pending");
      return;
    }
    const granted = acquireMotionSlot(surface);
    setSlot(granted ? "granted" : "denied");
    if (!granted) {
      return;
    }
    return () => {
      releaseMotionSlot(surface);
    };
  }, [surface, wantsMotion]);

  if (!active) {
    return denied("inactive");
  }
  if (prefersReducedMotion) {
    return denied("reduced-motion");
  }
  if (slot === "granted") {
    return GRANTED;
  }
  return denied(slot === "denied" ? "over-budget" : "pending");
}
