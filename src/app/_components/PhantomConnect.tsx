"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { truncateAddress } from "@/lib/format";

/* Minimal Phantom connector — uses window.solana directly, no
 * @solana/wallet-adapter scaffolding. v0 trust-the-wallet (no signMessage
 * round-trip yet); cryptographic sign-in is task #23 follow-up. */

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: { toBase58: () => string } | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toBase58: () => string };
  }>;
  disconnect: () => Promise<void>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeAllListeners?: () => void;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

interface Props {
  readonly onChange: (wallet: string | null) => void;
  readonly className?: string;
}

type State =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "disconnected" }
  | { kind: "connecting" }
  | { kind: "connected"; wallet: string }
  | { kind: "error"; reason: string };

export function PhantomConnect({ onChange, className }: Props) {
  const [state, setState] = useState<State>({ kind: "checking" });

  const setConnected = useCallback(
    (wallet: string) => {
      setState({ kind: "connected", wallet });
      onChange(wallet);
    },
    [onChange],
  );

  const setDisconnected = useCallback(() => {
    setState({ kind: "disconnected" });
    onChange(null);
  }, [onChange]);

  // Initial probe — try silent reconnect if user was previously connected.
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      const provider = typeof window !== "undefined" ? window.solana : undefined;
      if (!provider?.isPhantom) {
        if (!cancelled) setState({ kind: "missing" });
        return;
      }
      try {
        const resp = await provider.connect({ onlyIfTrusted: true });
        if (!cancelled) setConnected(resp.publicKey.toBase58());
      } catch {
        if (!cancelled) setDisconnected();
      }
    }
    probe();
    return () => {
      cancelled = true;
    };
  }, [setConnected, setDisconnected]);

  // Listen for Phantom-side events (account change, manual disconnect).
  useEffect(() => {
    const provider = typeof window !== "undefined" ? window.solana : undefined;
    if (!provider?.on) return;
    const onConnect = () => {
      if (provider.publicKey) setConnected(provider.publicKey.toBase58());
    };
    const onDisconnect = () => setDisconnected();
    provider.on("connect", onConnect);
    provider.on("disconnect", onDisconnect);
    provider.on("accountChanged", (pk: unknown) => {
      if (pk && typeof (pk as { toBase58?: () => string }).toBase58 === "function") {
        setConnected((pk as { toBase58: () => string }).toBase58());
      } else {
        setDisconnected();
      }
    });
  }, [setConnected, setDisconnected]);

  async function onConnect() {
    const provider = window.solana;
    if (!provider?.isPhantom) {
      setState({ kind: "missing" });
      return;
    }
    setState({ kind: "connecting" });
    try {
      const resp = await provider.connect();
      setConnected(resp.publicKey.toBase58());
    } catch (err) {
      setState({ kind: "error", reason: (err as Error).message });
    }
  }

  async function onDisconnect() {
    const provider = window.solana;
    if (provider) await provider.disconnect().catch(() => {});
    setDisconnected();
  }

  if (state.kind === "checking") {
    return (
      <div className={`text-mono-tight text-[12px] text-[var(--color-text-faint)] ${className ?? ""}`}>
        checking wallet…
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <a
        href="https://phantom.app/download"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex h-10 px-5 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] text-[13px] text-[var(--color-text)] hover:bg-[var(--color-bg-card)] transition-colors ${className ?? ""}`}
      >
        Install Phantom →
      </a>
    );
  }

  if (state.kind === "connected") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`inline-flex items-center gap-2 ${className ?? ""}`}
        >
          <span className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-pill)] border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[var(--color-accent)]"
            />
            <span className="text-mono-tight text-[12.5px] text-[var(--color-text)]">
              {truncateAddress(state.wallet)}
            </span>
          </span>
          <button
            type="button"
            onClick={onDisconnect}
            className="text-mono-tight text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors px-2"
          >
            disconnect
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <button
      type="button"
      onClick={onConnect}
      disabled={state.kind === "connecting"}
      className={`inline-flex h-10 px-5 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_24px_-6px_var(--color-accent)] transition-all duration-200 disabled:opacity-60 ${className ?? ""}`}
    >
      <span aria-hidden="true" className="text-[14px]">👻</span>
      {state.kind === "connecting" ? "Connecting…" : "Connect Phantom"}
    </button>
  );
}
