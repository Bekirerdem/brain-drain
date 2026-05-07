"use client";

import { useState } from "react";

const MCP_PATH = "/api/mcp";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const MCP_URL = `${APP_URL.replace(/\/$/, "")}${MCP_PATH}`;

const CURL_SNIPPET = `curl -X POST ${MCP_URL} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"brain_drain_query","arguments":{"question":"what is x402"}}}'`;

export function AgentQuickstart() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <CopyTile
        label="MCP URL"
        caption="paste into Claude Desktop / Cursor / your runtime"
        value={MCP_URL}
        ariaLabel="Copy MCP endpoint URL"
      />
      <CopyTile
        label="cURL"
        caption="runs against the live devnet endpoint"
        value={CURL_SNIPPET}
        ariaLabel="Copy cURL snippet"
        multiline
      />
    </div>
  );
}

type Tile = {
  label: string;
  caption: string;
  value: string;
  ariaLabel: string;
  multiline?: boolean;
};

function CopyTile({ label, caption, value, ariaLabel, multiline }: Tile) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked — keep silent
    }
  };

  return (
    <div className="group relative rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2 border-b border-[var(--color-border)]">
        <p className="text-eyebrow">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          aria-label={ariaLabel}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)]/60 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)]/40 transition-colors"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre
        className={`px-4 py-3.5 text-mono-tight text-[12px] leading-[1.55] text-[var(--color-text)] ${
          multiline ? "whitespace-pre overflow-x-auto" : "truncate"
        }`}
      >
        {value}
      </pre>
      <p className="px-4 pb-3.5 text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
        {caption}
      </p>
    </div>
  );
}
