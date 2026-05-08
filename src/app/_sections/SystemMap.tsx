"use client";

import { motion } from "framer-motion";

/* ─────────────────────────────────────────────────────────
 * SYSTEM MAP — full architecture in one viewport
 *
 *   Buyer side                     Brain Drain core                 Settlement
 *   ──────────                     ────────────────                 ──────────
 *   [Agent] ─→ [CDP Wallet] ─→ [MCP server] ─→ [x402 gateway] ─→ [Solana RPC] ─→ [Phantom Cash]
 *                                       ↑
 *                                  [RAG index] ←─ [Vault loader] ←─ [Markdown vault]
 *
 * Pure SVG, fixed viewBox, scales responsively. Animated USDC packets
 * travel along the main horizontal flow.
 * ───────────────────────────────────────────────────────── */

const VB_W = 1180;
const VB_H = 560;

const NODES = [
  { id: "agent", x: 60, y: 90, w: 140, h: 70, label: "Agent", tech: "MCP client", color: "violet" },
  { id: "cdp", x: 250, y: 90, w: 160, h: 70, label: "CDP Wallet", tech: "MPC threshold", color: "violet" },
  { id: "mcp", x: 460, y: 90, w: 170, h: 70, label: "MCP server", tech: "/api/mcp · HTTP", color: "accent" },
  { id: "x402", x: 680, y: 90, w: 180, h: 70, label: "x402 gateway", tech: "/api/v/[slug]/query · Zod", color: "accent" },
  { id: "solana", x: 910, y: 90, w: 180, h: 70, label: "Solana RPC", tech: "Helius · raw JSON-RPC", color: "amber" },
  { id: "phantom", x: 910, y: 430, w: 180, h: 70, label: "Phantom Cash", tech: "USDC payout", color: "amber" },
  { id: "rag", x: 460, y: 290, w: 170, h: 70, label: "RAG index", tech: "Gemini · 3072d cosine", color: "accent" },
  { id: "loader", x: 250, y: 290, w: 160, h: 70, label: "Vault loader", tech: "build-time chunk", color: "gray" },
  { id: "vault", x: 60, y: 290, w: 140, h: 70, label: "Markdown vault", tech: "Obsidian · 25 notes", color: "gray" },
] as const;

const EDGES = [
  { from: "agent", to: "cdp", color: "violet", animate: true, kind: "request" },
  { from: "cdp", to: "mcp", color: "violet", animate: true, kind: "request" },
  { from: "mcp", to: "x402", color: "accent", animate: true, kind: "request" },
  { from: "x402", to: "solana", color: "accent", animate: true, kind: "verify" },
  { from: "solana", to: "phantom", color: "amber", animate: true, kind: "settle", curve: "down" },
  { from: "vault", to: "loader", color: "gray", animate: false, kind: "build" },
  { from: "loader", to: "rag", color: "gray", animate: false, kind: "build" },
  { from: "rag", to: "x402", color: "accent", animate: true, kind: "retrieve", curve: "up" },
] as const;

const COLORS: Record<string, string> = {
  accent: "#19fb9b",
  violet: "#9945ff",
  amber: "#fbbf24",
  gray: "#4a4a55",
};

export function SystemMap() {
  return (
    <section
      id="system-map"
      className="bg-aurora bg-grain relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="bg-aurora-canvas opacity-40" aria-hidden="true" />
      <div className="bg-grain-overlay" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-28 lg:pt-32 lg:pb-36">
        <p className="text-eyebrow">System map</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)] max-w-3xl">
          Every component,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            one viewport.
          </em>
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          The full Brain Drain runtime: build-time vault indexing on the bottom
          row, runtime payment + retrieval on the top. Every box maps to a
          file you can open on GitHub.
        </p>

        <Legend />

        <motion.div
          className="mt-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ type: "spring", stiffness: 220, damping: 30 }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="w-full h-auto"
            role="img"
            aria-label="Brain Drain system architecture"
          >
            <defs>
              {Object.entries(COLORS).map(([key, color]) => (
                <marker
                  key={key}
                  id={`arrow-${key}`}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill={color} opacity="0.7" />
                </marker>
              ))}

              {EDGES.map((e, i) => (
                <path
                  key={`p-${i}`}
                  id={`edge-${i}`}
                  d={edgePath(e)}
                  fill="none"
                />
              ))}
            </defs>

            {/* Edges */}
            {EDGES.map((e, i) => {
              const color = COLORS[e.color];
              return (
                <path
                  key={`e-${i}`}
                  d={edgePath(e)}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.25"
                  strokeDasharray={e.animate ? "4 5" : "2 4"}
                  opacity={e.animate ? 0.55 : 0.3}
                  markerEnd={`url(#arrow-${e.color})`}
                />
              );
            })}

            {/* Animated packets on flowing edges */}
            {EDGES.filter((e) => e.animate).map((e, i) => (
              <circle key={`pkt-${i}`} r="3" fill={COLORS[e.color]}>
                <animateMotion
                  dur="3.2s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                >
                  <mpath href={`#edge-${EDGES.indexOf(e)}`} />
                </animateMotion>
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="3.2s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}

            {/* Nodes (rendered last so they sit on top) */}
            {NODES.map((n) => (
              <SystemNode key={n.id} node={n} />
            ))}

            {/* Layer labels */}
            <text
              x={40}
              y={70}
              className="fill-[var(--color-text-faint)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Runtime
            </text>
            <text
              x={40}
              y={270}
              className="fill-[var(--color-text-faint)]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Build-time
            </text>
          </svg>
        </motion.div>

        <p className="mt-6 text-mono-tight text-[12px] text-[var(--color-text-faint)] max-w-2xl leading-[1.6]">
          Top row is what an AI agent triggers at request time. Bottom row is
          what runs once at build (vault chunks → embeddings → on-disk index).
          The accent green path is the on-the-wire flow you actually pay for.
        </p>
      </div>
    </section>
  );
}

type NodeData = (typeof NODES)[number];

function SystemNode({ node }: { node: NodeData }) {
  const stroke = COLORS[node.color];
  const fill = `${stroke}10`; // very low alpha
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx="10"
        fill={fill}
        stroke={stroke}
        strokeOpacity="0.5"
        strokeWidth="1"
      />
      <text
        x={node.x + 16}
        y={node.y + 30}
        className="fill-[var(--color-text)]"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 500,
          fontSize: 14,
          letterSpacing: "-0.01em",
        }}
      >
        {node.label}
      </text>
      <text
        x={node.x + 16}
        y={node.y + 50}
        className="fill-[var(--color-text-muted)]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          letterSpacing: "-0.01em",
        }}
      >
        {node.tech}
      </text>
    </g>
  );
}

type Edge = (typeof EDGES)[number];

function edgePath(edge: Edge): string {
  const from = NODES.find((n) => n.id === edge.from);
  const to = NODES.find((n) => n.id === edge.to);
  if (!from || !to) return "";

  const fromCx = from.x + from.w;
  const fromCy = from.y + from.h / 2;
  const toCx = to.x;
  const toCy = to.y + to.h / 2;

  // Special routing for vertical edges
  if ("curve" in edge && edge.curve === "down") {
    // solana → phantom (same column, just go down)
    const cx = from.x + from.w / 2;
    return `M ${cx} ${from.y + from.h} L ${cx} ${to.y}`;
  }
  if ("curve" in edge && edge.curve === "up") {
    // rag → x402 (curve up + right)
    const startX = from.x + from.w / 2;
    const startY = from.y;
    const endX = to.x + to.w / 2;
    const endY = to.y + to.h;
    return `M ${startX} ${startY} C ${startX} ${(startY + endY) / 2}, ${endX} ${(startY + endY) / 2}, ${endX} ${endY}`;
  }

  return `M ${fromCx} ${fromCy} L ${toCx} ${toCy}`;
}

function Legend() {
  const items = [
    { color: "accent", label: "Brain Drain core" },
    { color: "violet", label: "Buyer-side" },
    { color: "amber", label: "Settlement" },
    { color: "gray", label: "Build-time" },
  ];
  return (
    <ul className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
      {items.map((it) => (
        <li key={it.color} className="inline-flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ background: COLORS[it.color] }}
          />
          <span className="text-mono-tight text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {it.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
