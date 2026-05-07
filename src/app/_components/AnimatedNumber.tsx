"use client";

import {
  animate,
  useMotionValue,
  useTransform,
  motion,
  useReducedMotion,
  useAnimationControls,
} from "framer-motion";
import { useEffect } from "react";

const MOUNT_DURATION = 0.9;
const UPDATE_DURATION = 0.4;
const MOUNT_EASE = [0.16, 1, 0.3, 1] as const;
const UPDATE_EASE = [0.33, 1, 0.68, 1] as const;
const BUMP_DURATION = 0.32;
const BUMP_SCALE = 1.04;

type Props = {
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  className?: string;
  /**
   * Optional trigger token. When this changes, the digit briefly scales
   * to BUMP_SCALE and back — a "something just happened" kicker. Pass
   * a monotonically-changing token (e.g. latest signature) to fire one
   * bump per real event.
   */
  bumpOn?: string | number | null;
};

/**
 * Mount: dramatic ramp from 0 → value (~900ms expressive easing).
 * Updates: subtle smooth transition (~400ms).
 * Bump: optional 320ms scale flash on bumpOn change.
 * Honors prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format = (n) => n.toString(),
  prefix = "",
  suffix = "",
  delay = 0,
  className,
  bumpOn,
}: Props) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const display = useTransform(
    motionValue,
    (latest) => `${prefix}${format(latest)}${suffix}`,
  );
  const controls = useAnimationControls();

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const isMount = motionValue.get() === 0 && value > 0;
    const ctrls = animate(motionValue, value, {
      duration: isMount ? MOUNT_DURATION : UPDATE_DURATION,
      ease: isMount ? MOUNT_EASE : UPDATE_EASE,
      delay: isMount ? delay : 0,
    });
    return () => ctrls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  useEffect(() => {
    if (reduced) return;
    if (bumpOn === undefined || bumpOn === null) return;
    controls.start({
      scale: [1, BUMP_SCALE, 1],
      transition: { duration: BUMP_DURATION, ease: "easeOut" },
    });
  }, [bumpOn, controls, reduced]);

  return (
    <motion.span
      className={className}
      animate={controls}
      style={{ display: "inline-block" }}
    >
      {display}
    </motion.span>
  );
}
