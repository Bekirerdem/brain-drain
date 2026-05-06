"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import bs58 from "bs58";
import { truncateAddress } from "@/lib/format";

/* Phantom sign-in-with-Solana flow:
 *   1. window.solana.connect() — get publicKey
 *   2. POST /api/auth/challenge {wallet} — server stores nonce in Supabase, returns challenge string
 *   3. window.solana.signMessage(challenge, 'utf8') — Phantom popup, user approves
 *   4. POST /api/auth/verify {wallet, challenge, signature} — server verifies ed25519, sets bd_session cookie
 *   5. State -> connected. All subsequent /api/* calls inherit the cookie.
 *
 * On mount, GET /api/auth/me checks for an existing valid session — no
 * popup needed if the user already signed in this hour. */

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: { toBase58: () => string } | null;
  isConnected: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toBase58: () => string };
  }>;
  disconnect: () => Promise<void>;
  signMessage: (
    message: Uint8Array,
    encoding?: "utf8" | "hex",
  ) => Promise<{ signature: Uint8Array; publicKey: { toBase58: () => string } }>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
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
  | { kind: "connecting" } // connect → challenge → signMessage → verify
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

  // Initial probe: server session is the source of truth.
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      const provider = typeof window !== "undefined" ? window.solana : undefined;
      if (!provider?.isPhantom) {
        if (!cancelled) setState({ kind: "missing" });
        return;
      }
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) throw new Error(`session probe ${res.status}`);
        const data = (await res.json()) as { wallet: string | null };
        if (cancelled) return;
        if (data.wallet) setConnected(data.wallet);
        else setDisconnected();
      } catch {
        if (!cancelled) setDisconnected();
      }
    }
    probe();
    return () => {
      cancelled = true;
    };
  }, [setConnected, setDisconnected]);

  async function onConnect(): Promise<void> {
    const provider = window.solana;
    if (!provider?.isPhantom) {
      setState({ kind: "missing" });
      return;
    }
    setState({ kind: "connecting" });
    try {
      const connectResp = await provider.connect();
      const wallet = connectResp.publicKey.toBase58();

      const challengeRes = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      if (!challengeRes.ok) throw new Error(`challenge ${challengeRes.status}`);
      const { challenge } = (await challengeRes.json()) as { challenge: string };

      const signed = await provider.signMessage(
        new TextEncoder().encode(challenge),
        "utf8",
      );
      const signature = bs58.encode(signed.signature);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet, challenge, signature }),
      });
      if (!verifyRes.ok) {
        const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `verify ${verifyRes.status}`);
      }
      setConnected(wallet);
    } catch (err) {
      const reason = (err as Error).message ?? "sign-in failed";
      setState({ kind: "error", reason });
    }
  }

  async function onDisconnect(): Promise<void> {
    const provider = window.solana;
    if (provider) await provider.disconnect().catch(() => {});
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setDisconnected();
  }

  if (state.kind === "checking") {
    return (
      <div
        className={`text-mono-tight text-[12px] text-[var(--color-text-faint)] ${className ?? ""}`}
      >
        checking session…
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
    <div className={`inline-flex flex-col gap-1.5 ${className ?? ""}`}>
      <button
        type="button"
        onClick={onConnect}
        disabled={state.kind === "connecting"}
        className="inline-flex h-10 px-5 items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-[var(--color-bg)] text-[13px] font-medium hover:brightness-110 hover:shadow-[0_0_24px_-6px_var(--color-accent)] transition-all duration-200 disabled:opacity-60"
      >
        <span aria-hidden="true" className="text-[14px]">
          👻
        </span>
        {state.kind === "connecting" ? "Signing…" : "Connect Phantom"}
      </button>
      {state.kind === "error" && (
        <p className="text-mono-tight text-[11px] text-[#ff8a8a]">
          {state.reason}
        </p>
      )}
    </div>
  );
}
