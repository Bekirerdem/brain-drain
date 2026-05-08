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

function usage(): never {
  console.error(
    'Usage:\n' +
      '  bun scripts/test-mcp.ts list\n' +
      '  bun scripts/test-mcp.ts list_vaults [--domain <tag>]\n' +
      '  bun scripts/test-mcp.ts vault_payouts <slug> [limit]\n' +
      '  bun scripts/test-mcp.ts query_vault <slug> "<question>"',
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const tool = process.argv[2];

  if (tool === "list") {
    const result = await call({ jsonrpc: "2.0", id: 1, method: "tools/list" });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (tool === "list_vaults") {
    const domainFlag = process.argv.indexOf("--domain");
    const domain = domainFlag >= 0 ? process.argv[domainFlag + 1] : undefined;
    const args: Record<string, unknown> = {};
    if (domain) args.domain = domain;
    const result = await call({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "brain_drain_list_vaults", arguments: args },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (tool === "vault_payouts") {
    const slug = process.argv[3];
    if (!slug) usage();
    const limit = process.argv[4] ? Number(process.argv[4]) : 5;
    const result = await call({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "brain_drain_vault_payouts",
        arguments: { slug, limit },
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (tool === "query_vault") {
    const slug = process.argv[3];
    const question = process.argv[4];
    if (!slug || !question) usage();
    const result = await call({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "brain_drain_query_vault",
        arguments: { slug, question },
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  usage();
}

main().catch((error) => {
  console.error("[mcp] FAIL:", error);
  process.exit(1);
});
