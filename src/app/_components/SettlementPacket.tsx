"use client";

import { motion } from "framer-motion";
import { OFFSETS, SPRINGS } from "@/lib/motion/presets";

const HOLD_MS = 80;
const FADE_MS = 200;

/**
 * Small green packet that flies from off the right edge of the feed
 * row into the row's right margin, holds, then fades out. Mounts
 * conditionally on new highlighted rows; consumer is responsible for
 * unmounting after ~900ms (or via AnimatePresence exit).
 */
export function SettlementPacket({ onDone }: { onDone?: () => void }) {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ x: OFFSETS.edge * 2.5, opacity: 0, scale: 0.6 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRINGS.packet}
      onAnimationComplete={() => {
        if (!onDone) return;
        setTimeout(onDone, HOLD_MS + FADE_MS);
      }}
      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-3 h-3 rounded-[3px] bg-[var(--color-accent)] shadow-[0_0_18px_-2px_var(--color-accent)]"
    />
  );
}
