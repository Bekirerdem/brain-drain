"use client";

/* ─────────────────────────────────────────────────────────
 * ORBIT VISUAL — data flow metaphor for the Hero
 *
 *  [Agent]──USDC──→[Brain Drain]──USDC──→[Phantom Cash]
 *      ↑              │
 *      └─snippet──────┘
 *
 * - Three nodes: Agent (left), Brain Drain (center, pulsing accent),
 *   Phantom Cash (right).
 * - Three SVG paths with `<animateMotion>` packets traveling along them.
 * - Pure SVG. No JS animation tick. Hardware-accelerated, hidden when reduced-motion.
 * ───────────────────────────────────────────────────────── */

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DURATION_MS } from "@/lib/motion/presets";
import { useLiveEvents } from "@/lib/live-events/context";

type Props = { active: boolean };

const VB_W = 520;
const VB_H = 380;

export function OrbitVisual({ active }: Props) {
  const reduced = useReducedMotion();
  const { recent } = useLiveEvents();
  const [pulsing, setPulsing] = useState(false);
  const lastSigRef = useRef<string | null>(null);

  useEffect(() => {
    if (reduced) return;
    const head = recent[0]?.signature ?? null;
    if (!head || head === lastSigRef.current) return;
    lastSigRef.current = head;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), DURATION_MS.reveal);
    return () => clearTimeout(t);
  }, [recent, reduced]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Data flow: Agent pays USDC, Brain Drain returns snippet, USDC settles in Phantom Cash"
      >
        <defs>
          <linearGradient id="accent-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(25,251,155,0)" />
            <stop offset="50%" stopColor="rgba(25,251,155,0.6)" />
            <stop offset="100%" stopColor="rgba(25,251,155,0)" />
          </linearGradient>
          <linearGradient id="violet-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(153,69,255,0)" />
            <stop offset="50%" stopColor="rgba(153,69,255,0.6)" />
            <stop offset="100%" stopColor="rgba(153,69,255,0)" />
          </linearGradient>
          <linearGradient id="amber-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="50%" stopColor="rgba(251,191,36,0.6)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>

          <radialGradient id="brain-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(25,251,155,0.35)" />
            <stop offset="60%" stopColor="rgba(25,251,155,0.08)" />
            <stop offset="100%" stopColor="rgba(25,251,155,0)" />
          </radialGradient>

          <path id="path-pay" d="M 120 190 L 200 190" />
          <path
            id="path-snippet"
            d="M 200 210 Q 150 280 110 220"
            fill="none"
          />
          <path id="path-settle" d="M 324 190 L 404 190" />
        </defs>

        {/* Brain Drain glow halo — base always-on, pulse layer on settlements */}
        <circle
          cx="262"
          cy="190"
          r="120"
          fill="url(#brain-glow)"
          opacity={active ? 1 : 0}
          style={{ transition: "opacity 600ms ease-out" }}
        />
        {pulsing && !reduced && (
          <motion.circle
            cx="262"
            cy="190"
            r="120"
            fill="url(#brain-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: DURATION_MS.reveal / 1000, ease: "easeOut" }}
          />
        )}

        {/* Path strokes (faint guide lines) */}
        <use
          href="#path-pay"
          stroke="url(#accent-fade)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          fill="none"
          opacity={active ? 0.7 : 0}
          style={{ transition: "opacity 800ms ease-out 200ms" }}
        />
        <use
          href="#path-snippet"
          stroke="url(#violet-fade)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          fill="none"
          opacity={active ? 0.7 : 0}
          style={{ transition: "opacity 800ms ease-out 350ms" }}
        />
        <use
          href="#path-settle"
          stroke="url(#amber-fade)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
          fill="none"
          opacity={active ? 0.7 : 0}
          style={{ transition: "opacity 800ms ease-out 500ms" }}
        />

        {/* Animated packets — only run when active and not reduced-motion */}
        {active && !reduced && (
          <>
            <Packet pathId="#path-pay" color="#19fb9b" duration="2.4s" delay="0s" />
            <Packet pathId="#path-pay" color="#19fb9b" duration="2.4s" delay="1.2s" />
            <Packet
              pathId="#path-snippet"
              color="#9945ff"
              duration="2.6s"
              delay="0.6s"
            />
            <Packet
              pathId="#path-settle"
              color="#fbbf24"
              duration="2.8s"
              delay="0.4s"
            />
            <Packet
              pathId="#path-settle"
              color="#fbbf24"
              duration="2.8s"
              delay="1.8s"
            />
          </>
        )}

        {/* Nodes */}
        <Node
          cx={80}
          cy={190}
          r={36}
          stroke="#9945ff"
          fill="rgba(153,69,255,0.08)"
          icon={<NodeIcon kind="agent" />}
          label="Agent"
          sublabel="CDP MPC"
        />
        <motion.g
          style={{ originX: "262px", originY: "190px" }}
          animate={pulsing && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: DURATION_MS.reveal / 1000, ease: "easeOut" }}
        >
          <Node
            cx={262}
            cy={190}
            r={62}
            stroke="#19fb9b"
            fill="rgba(25,251,155,0.06)"
            glow
            icon={<NodeIcon kind="vault" />}
            label="Brain Drain"
            sublabel="x402 + RAG"
          />
        </motion.g>
        <Node
          cx={440}
          cy={190}
          r={36}
          stroke="#fbbf24"
          fill="rgba(251,191,36,0.08)"
          icon={<NodeIcon kind="cash" />}
          label="Phantom Cash"
          sublabel="USDC payout"
        />
      </svg>
    </div>
  );
}

type NodeProps = {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  fill: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  glow?: boolean;
};

function Node({ cx, cy, r, stroke, fill, icon, label, sublabel, glow }: NodeProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth="1.25" />
      {glow && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="1"
          opacity="0.4"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: "orbit-pulse 3.4s ease-in-out infinite",
          }}
        />
      )}
      <g transform={`translate(${cx - 10}, ${cy - 10})`}>{icon}</g>
      <text
        x={cx}
        y={cy + r + 22}
        textAnchor="middle"
        className="fill-[var(--color-text)] text-[12px]"
        style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}
      >
        {label}
      </text>
      <text
        x={cx}
        y={cy + r + 38}
        textAnchor="middle"
        className="fill-[var(--color-text-faint)] text-[10px]"
        style={{
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {sublabel}
      </text>
    </g>
  );
}

function Packet({
  pathId,
  color,
  duration,
  delay,
}: {
  pathId: string;
  color: string;
  duration: string;
  delay: string;
}) {
  return (
    <circle r="3" fill={color}>
      <animateMotion dur={duration} begin={delay} repeatCount="indefinite">
        <mpath href={pathId} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.15;0.85;1"
        dur={duration}
        begin={delay}
        repeatCount="indefinite"
      />
    </circle>
  );
}

function NodeIcon({ kind }: { kind: "agent" | "vault" | "cash" }) {
  if (kind === "agent") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="3" stroke="#9945ff" strokeWidth="1.4" />
        <circle cx="7" cy="9" r="1" fill="#9945ff" />
        <circle cx="13" cy="9" r="1" fill="#9945ff" />
        <path d="M6 13h8" stroke="#9945ff" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "vault") {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M3 4l7-2 7 2v7c0 4-3 6-7 7-4-1-7-3-7-7V4z"
          stroke="#19fb9b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M7 9l2 2 4-4" stroke="#19fb9b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="6" width="16" height="10" rx="2" stroke="#fbbf24" strokeWidth="1.4" />
      <path d="M5 9h10" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14" cy="13" r="1.4" fill="#fbbf24" />
    </svg>
  );
}
