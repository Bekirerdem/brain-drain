/**
 * Motion presets — single source of truth for every spring, stagger,
 * offset, and duration used across the app.
 *
 * Per page-load-animations recipe: named timing constants > magic numbers
 * in delay props. New motion code MUST import from here.
 */

/**
 * @deprecated SPRINGS is deprecated in Terminal Brutalism (Yön 2) design system.
 * Use GSAP utilities or stepped reveals instead.
 */
export const SPRINGS = {
  snappy:   { type: "spring" as const, stiffness: 400, damping: 30 },
  smooth:   { type: "spring" as const, stiffness: 300, damping: 30 },
  bouncy:   { type: "spring" as const, stiffness: 280, damping: 26 },
  stiff:    { type: "spring" as const, stiffness: 350, damping: 28 },
  headline: { type: "spring" as const, stiffness: 320, damping: 28 },
  packet:   { type: "spring" as const, stiffness: 220, damping: 22 },
} as const;

export const STAGGER = {
  tight:   0.04,
  normal:  0.06,
  relaxed: 0.12,
} as const;

export const OFFSETS = {
  rise: 16,
  drop: -8,
  edge: 24,
} as const;

export const DURATION_MS = {
  kick:   300,
  reveal: 600,
  packet: 720,
} as const;
