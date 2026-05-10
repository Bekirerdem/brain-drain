"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "bd-theme";

interface ThemeContextValue {
  readonly theme: Theme;
  readonly setTheme: (next: Theme) => void;
  readonly toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ProviderProps {
  readonly children: ReactNode;
}

/**
 * The actual `data-theme` attribute is set by the inline init script in
 * layout.tsx (so the first paint already matches user preference). This
 * provider only mirrors that value in React state and persists changes
 * to localStorage when the user toggles.
 */
export function ThemeProvider({ children }: ProviderProps) {
  const [theme, setThemeState] = useState<Theme>("dark");

  // Hydrate from the DOM once mounted — the inline script set the
  // attribute already, we just sync React's view of it.
  useEffect(() => {
    const initial =
      (document.documentElement.dataset.theme as Theme | undefined) ?? "dark";
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (private mode / strict cookies) — class still
      // sticks for the session, just not across reloads.
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
