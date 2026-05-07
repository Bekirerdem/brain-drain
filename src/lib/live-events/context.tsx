"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

const MAX_RECENT = 5;

export type LiveEvent = {
  signature: string;
  vaultSlug: string | null;
  ts: number;
};

type Ctx = {
  recent: LiveEvent[];
  push: (e: LiveEvent) => void;
};

const LiveEventsContext = createContext<Ctx | null>(null);

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<LiveEvent[]>([]);

  const push = useCallback((e: LiveEvent) => {
    setRecent((prev) => {
      if (prev[0]?.signature === e.signature) return prev;
      const filtered = prev.filter((p) => p.signature !== e.signature);
      return [e, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  return (
    <LiveEventsContext.Provider value={{ recent, push }}>
      {children}
    </LiveEventsContext.Provider>
  );
}

export function useLiveEvents(): Ctx {
  const ctx = useContext(LiveEventsContext);
  if (!ctx) {
    throw new Error("useLiveEvents must be used within LiveEventsProvider");
  }
  return ctx;
}
