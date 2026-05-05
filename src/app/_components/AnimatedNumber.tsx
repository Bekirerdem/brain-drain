"use client";

import { animate, useMotionValue, useTransform, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

const MOUNT_DURATION = 0.9;
const UPDATE_DURATION = 0.4;
const MOUNT_EASE = [0.16, 1, 0.3, 1] as const;
const UPDATE_EASE = [0.33, 1, 0.68, 1] as const;

type Props = {
  value: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  delay?: number;
  className?: string;
};

/**
 * Mount: dramatic ramp from 0 → value (~900ms expressive easing).
 * Updates: subtle smooth transition (~400ms).
 * Honors prefers-reduced-motion.
 */
export function AnimatedNumber({
  value,
  format = (n) => n.toString(),
  prefix = "",
  suffix = "",
  delay = 0,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const display = useTransform(motionValue, (latest) => `${prefix}${format(latest)}${suffix}`);

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const isMount = motionValue.get() === 0 && value > 0;
    const controls = animate(motionValue, value, {
      duration: isMount ? MOUNT_DURATION : UPDATE_DURATION,
      ease: isMount ? MOUNT_EASE : UPDATE_EASE,
      delay: isMount ? delay : 0,
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduced]);

  return <motion.span className={className}>{display}</motion.span>;
}
