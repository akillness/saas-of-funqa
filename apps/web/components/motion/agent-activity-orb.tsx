"use client";

import { ThinkingOrb } from "thinking-orbs";

import { useMotionCapability } from "@/components/motion/motion-policy";

/**
 * FunQA's own vocabulary for "what is the search agent doing right now".
 *
 * This exists so screens depend on a FunQA concept rather than on
 * `thinking-orbs`' nine state names. If the renderer is ever swapped, this map
 * is the only thing that changes.
 */
export type AgentActivity = "dispatching" | "retrieving" | "ranking" | "synthesizing";

/**
 * Job → state mapping, chosen for meaning rather than for looks:
 *  dispatching  → `connecting`  (a query is being wired to an engine)
 *  retrieving   → `searching`   (a scan sweeps the indexed logs)
 *  ranking      → `solving`     (bands scramble, then click back into order)
 *  synthesizing → `weaving`     (strands plait a finding out of evidence)
 */
const ACTIVITY_TO_ORB_STATE = {
  dispatching: "connecting",
  retrieving: "searching",
  ranking: "solving",
  synthesizing: "weaving"
} as const;

export type AgentActivityOrbProps = {
  activity: AgentActivity;
  /** Only `true` while the agent is genuinely working. */
  active?: boolean;
  /** 20 for inline status, 64 for a panel-scale indicator. */
  size?: 20 | 64;
  className?: string;
};

/**
 * Animated agent-activity indicator, with a static dot as its contract-level
 * fallback.
 *
 * Accessibility ownership is explicit: the orb is **always decorative**. Every
 * call site in FunQA already has a `role="status"` / `aria-live` region that
 * owns the announcement, and an `aria-label` on a canvas is not a live
 * announcement. Duplicating the state here would make screen readers say the
 * same thing twice.
 *
 * The renderer is only mounted once `useMotionCapability` grants a slot, so the
 * server, the reduced-motion path, and the over-budget path all render the same
 * inert markup.
 */
export function AgentActivityOrb({
  activity,
  active = true,
  size = 20,
  className
}: AgentActivityOrbProps) {
  const motion = useMotionCapability("agent-orb", active);
  const classNames = ["funqa-agent-orb", className].filter(Boolean).join(" ");

  if (!motion.animate) {
    return (
      <span
        className={classNames}
        style={{ ["--funqa-orb-size" as string]: `${size}px` }}
        data-motion="static"
        data-activity={activity}
        data-reason={motion.reason}
        aria-hidden="true"
      >
        <span className="funqa-agent-orb-static" />
      </span>
    );
  }

  return (
    <span
      className={classNames}
      style={{ ["--funqa-orb-size" as string]: `${size}px` }}
      data-motion="animated"
      data-activity={activity}
      aria-hidden="true"
    >
      <ThinkingOrb state={ACTIVITY_TO_ORB_STATE[activity]} size={size} />
    </span>
  );
}
