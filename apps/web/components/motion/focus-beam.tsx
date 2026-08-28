"use client";

import type { ReactNode } from "react";
import { BorderBeam } from "border-beam";

import { useMotionCapability } from "@/components/motion/motion-policy";

export type FocusBeamProps = {
  children: ReactNode;
  /** Only `true` when this really is *the* control the operator should press. */
  active?: boolean;
  className?: string;
};

/**
 * A single traveling-border accent for the one primary control on a screen.
 *
 * Boundaries taken straight from the source audit:
 *  - `border-beam`'s rotate family does **not** consult
 *    `prefers-reduced-motion`; only its pulse family does. So the wrapper, not
 *    the library, decides whether to mount it at all.
 *  - Every mount generates an ID-scoped stylesheet, so the budget in
 *    `motion-policy` caps this at one instance per page. Extra call sites keep
 *    working — they render the static border instead of a second beam.
 *  - The effect layer is `pointer-events: none` inside the library, and the
 *    real control keeps its own focus ring and label, so this wrapper never
 *    owns interaction or accessibility.
 */
export function FocusBeam({ children, active = true, className }: FocusBeamProps) {
  const motion = useMotionCapability("focus-beam", active);
  const classNames = ["funqa-focus-beam", className].filter(Boolean).join(" ");

  if (!motion.animate) {
    return (
      <span className={classNames} data-motion="static" data-reason={motion.reason}>
        {children}
      </span>
    );
  }

  return (
    <BorderBeam
      className={classNames}
      data-motion="animated"
      size="sm"
      colorVariant="ocean"
      theme="dark"
      active
    >
      {children}
    </BorderBeam>
  );
}
