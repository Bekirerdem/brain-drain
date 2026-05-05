"use client";

import { useState } from "react";

type Tab = {
  id: string;
  label: string;
  language: string;
  code: string;
};

type Props = {
  tabs: readonly Tab[];
};

export function CodeTabs({ tabs }: Props) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(current.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // older browsers — no-op
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-3 lg:px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/40">
        <div className="flex items-center gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              type="button"
              className={`px-3 h-8 inline-flex items-center text-[12px] rounded-[var(--radius-pill)] transition-colors ${
                t.id === current.id
                  ? "bg-[var(--color-bg-elevated)] text-[var(--color-text)] border border-[var(--color-border-strong)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="text-mono-tight text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] hover:text-[var(--color-accent)] transition-colors px-2"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="px-4 lg:px-5 py-5 overflow-x-auto text-mono-tight text-[12.5px] leading-[1.7] text-[var(--color-text-muted)]">
        <code>{current.code}</code>
      </pre>
      <div className="px-4 lg:px-5 py-2 border-t border-[var(--color-border)] flex items-center justify-end">
        <span className="text-mono-tight text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-faint)]">
          {current.language}
        </span>
      </div>
    </div>
  );
}
