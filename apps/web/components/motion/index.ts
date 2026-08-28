export { AgentActivityOrb } from "@/components/motion/agent-activity-orb";
export type { AgentActivity, AgentActivityOrbProps } from "@/components/motion/agent-activity-orb";
export { FocusBeam } from "@/components/motion/focus-beam";
export type { FocusBeamProps } from "@/components/motion/focus-beam";
export {
  MOTION_BUDGET,
  REDUCED_MOTION_QUERY,
  acquireMotionSlot,
  motionSlotsInUse,
  releaseMotionSlot,
  resetMotionBudget,
  useMotionCapability,
  usePrefersReducedMotion
} from "@/components/motion/motion-policy";
export type {
  MotionDecision,
  MotionDenialReason,
  MotionSurface
} from "@/components/motion/motion-policy";
