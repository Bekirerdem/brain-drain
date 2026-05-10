"use client";

import { useEffect, useState } from "react";

const REPO_URL = "https://github.com/Bekirerdem/brain-drain";
const API_URL = "https://api.github.com/repos/Bekirerdem/brain-drain";
// Cache header for the public GitHub API — they 403 on rapid hits
// without etag negotiation, but for landing page polling once per
// session is fine.
const FETCH_OPTS: RequestInit = {
  headers: { Accept: "application/vnd.github+json" },
  cache: "force-cache",
  next: { revalidate: 600 },
};

function formatStars(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  return `${Math.round(n / 1000)}k`;
}

export function GitHubStarButton() {
  // Render with a placeholder count so the button stays the same size
  // before/after the GitHub fetch resolves.
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL, FETCH_OPTS)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stargazers_count?: number } | null) => {
        if (cancelled || !data) return;
        if (typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {
        // Network blip — leave the button in its placeholder state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center rounded-[var(--radius-pill)] border border-[var(--color-border-strong)] bg-[var(--color-bg-card)]/60 backdrop-blur-sm hover:bg-[var(--color-bg-card)] hover:border-[var(--color-border-emphasis)] transition-colors text-[12.5px] text-[var(--color-text)] overflow-hidden"
      aria-label={`Star Brain Drain on GitHub${stars !== null ? ` (${stars} stars)` : ""}`}
    >
      <span className="inline-flex items-center gap-1.5 px-3 h-full border-r border-[var(--color-border)]">
        <GitHubIcon />
        Star
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 h-full text-mono-tight tabular-nums text-[var(--color-text-muted)]">
        <StarIcon />
        {stars === null ? "—" : formatStars(stars)}
      </span>
    </a>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
    </svg>
  );
}
