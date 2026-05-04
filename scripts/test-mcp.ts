#!/usr/bin/env bun
import { env } from "../src/lib/env";

const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/mcp`;
const REQUEST_TIMEOUT_MS = 180_000;

interface JsonRpcRequest {
  readonly jsonrpc: "2.0";
  readonly id: number;
  readonly method: string;
  readonly params?: Record<string, unknown>;
}

async function call(body: JsonRpcRequest): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  console.log(`[mcp] ${body.method} → ${res.status}`);
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
  return res.json();
}

async function main(): Promise<void> {
  const tool = process.argv[2];
  const question = process.argv[3] ?? "What did Bekir learn about Solana CPI patterns";

  if (tool === "list") {
    const result = await call({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (tool === "payouts") {
    const result = await call({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "brain_drain_payouts", arguments: { limit: 5 } },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (tool === "query") {
    const result = await call({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "brain_drain_query", arguments: { question } },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.error('Usage: bun scripts/test-mcp.ts <list|payouts|query> ["question"]');
  process.exit(1);
}

main().catch((error) => {
  console.error("[mcp] FAIL:", error);
  process.exit(1);
});
