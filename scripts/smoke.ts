#!/usr/bin/env bun
/**
 * One-command smoke test for Brain Drain.
 *
 * Hits every critical surface against the live deployment (or any
 * --target=<URL> override) and prints a pass/fail summary that any
 * reviewer can reproduce. Exits non-zero if any check fails so this
 * can wire into CI later.
 *
 *   bun scripts/smoke.ts
 *   bun scripts/smoke.ts --target=https://staging.example.com
 */

const DEFAULT_TARGET = "https://brain-drain-iota.vercel.app";

interface Check {
  readonly name: string;
  readonly run: () => Promise<{ ok: boolean; detail: string }>;
}

function resolveTarget(): string {
  const flag = process.argv.find((a) => a.startsWith("--target="));
  if (flag) return flag.slice("--target=".length).replace(/\/$/, "");
  return DEFAULT_TARGET.replace(/\/$/, "");
}

const TARGET = resolveTarget();

async function expectStatus(
  name: string,
  url: string,
  expected: number,
  init?: RequestInit,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(url, init);
    const ok = res.status === expected;
    return {
      ok,
      detail: ok
        ? `${res.status}`
        : `expected ${expected}, got ${res.status}`,
    };
  } catch (err) {
    return { ok: false, detail: `${(err as Error).message}` };
  }
}

const PAGE_ROUTES = [
  "/",
  "/vaults",
  "/vaults/news-trade-agent",
  "/vaults/x402-solana-build-log",
  "/vaults/koza-l1-playbook",
  "/vaults/devops-gotchas",
  "/vaults/bekir-erdem",
  "/vaults/new",
  "/dashboard",
];

const API_GETS = [
  { path: "/api/payouts?limit=3", expected: 200 },
  { path: "/api/vaults?limit=3", expected: 200 },
  { path: "/api/auth/me", expected: 200 },
];

function buildChecks(): Check[] {
  const pageChecks: Check[] = PAGE_ROUTES.map((p) => ({
    name: `GET ${p}`,
    run: () => expectStatus(`GET ${p}`, `${TARGET}${p}`, 200),
  }));

  const apiChecks: Check[] = API_GETS.map(({ path, expected }) => ({
    name: `GET ${path}`,
    run: () => expectStatus(`GET ${path}`, `${TARGET}${path}`, expected),
  }));

  const x402Probe: Check = {
    name: "POST /api/v/news-trade-agent/query (no payment) → 402",
    run: () =>
      expectStatus(
        "x402 quote",
        `${TARGET}/api/v/news-trade-agent/query`,
        402,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: "smoke test" }),
        },
      ),
  };

  const unauthVaultPost: Check = {
    name: "POST /api/vaults (no session) → 401",
    run: () =>
      expectStatus(
        "unauth POST /api/vaults",
        `${TARGET}/api/vaults`,
        401,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug: "x", name: "x", files: [] }),
        },
      ),
  };

  const mcpToolsList: Check = {
    name: "POST /api/mcp tools/list → 4 tools",
    run: async () => {
      try {
        const res = await fetch(`${TARGET}/api/mcp`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list",
          }),
        });
        if (!res.ok) {
          return { ok: false, detail: `status ${res.status}` };
        }
        const text = await res.text();
        const tools = (text.match(/"name":"brain_drain_[^"]+"/g) ?? []).length;
        return {
          ok: tools === 4,
          detail: `found ${tools} tool(s); expected 4`,
        };
      } catch (err) {
        return { ok: false, detail: (err as Error).message };
      }
    },
  };

  const mcpListVaults: Check = {
    name: "POST /api/mcp brain_drain_list_vaults",
    run: async () => {
      try {
        const res = await fetch(`${TARGET}/api/mcp`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
              name: "brain_drain_list_vaults",
              arguments: { limit: 5 },
            },
          }),
        });
        if (!res.ok) {
          return { ok: false, detail: `status ${res.status}` };
        }
        const text = await res.text();
        const slugMatches = text.match(/"slug":"[^"]+"/g) ?? [];
        return {
          ok: slugMatches.length > 0,
          detail: `found ${slugMatches.length} vault(s)`,
        };
      } catch (err) {
        return { ok: false, detail: (err as Error).message };
      }
    },
  };

  return [
    ...pageChecks,
    ...apiChecks,
    x402Probe,
    unauthVaultPost,
    mcpToolsList,
    mcpListVaults,
  ];
}

async function main(): Promise<void> {
  console.log(`[smoke] target: ${TARGET}\n`);
  const checks = buildChecks();
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const start = performance.now();
    const result = await check.run();
    const ms = Math.round(performance.now() - start);
    const tag = result.ok ? "✓" : "✗";
    console.log(
      `  ${tag}  ${check.name.padEnd(60)}  ${result.detail.padEnd(20)}  ${ms}ms`,
    );
    if (result.ok) passed++;
    else failed++;
  }

  console.log(
    `\n[smoke] ${passed} passed · ${failed} failed · ${checks.length} total`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[smoke] fatal", err);
  process.exit(1);
});
