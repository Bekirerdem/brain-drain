---
title: MCP server architecture for monetised Solana endpoints
tags: [mcp, solana, brain-drain, architecture, agentic]
created: 2026-04-30
updated: 2026-05-01
sources: [Anthropic MCP spec, Frames frames.ag tools registry, MCPay SDK README]
---

# What MCP gives Brain Drain for free

Model Context Protocol is the wire format for tool calls between an LLM client (Claude Desktop, Cursor, OpenAI Codex, OpenCode, OpenClaw) and a server that exposes tools. By 2026 every major agent client speaks MCP; by exposing one MCP tool we become addressable from every major client without writing one SDK per client.

Brain Drain runs an MCP server with **one tool, `brain_drain.query`**. The tool is the entire public surface area of the product as far as agents are concerned.

## Why one tool, not many

Two-and-only-two reasons for the minimal surface:

1. **Cognitive simplicity for the agent.** A buyer agent's tool router only has to learn one Brain Drain affordance. "Need niche knowledge that GPT-5 / Gemini 3 doesn't know? Call `brain_drain.query`." More tools = more router decisions = more cost per agent invocation.
2. **Demo legibility.** A judge watching the 3-minute video sees the agent call exactly one tool. The story is unambiguous.

Future tools (`brain_drain.list_vaults`, `brain_drain.subscribe`) live in v1 if they earn their place.

## The tool definition

```json
{
  "name": "brain_drain.query",
  "description": "Query Bekir Erdem's curated knowledge vault. The vault contains expert notes on Avalanche L1 deployment, Foundry verification gotchas, x402 micropayments, MCP architecture, n8n + Claude orchestration, Apify lead-gen patterns, and several other niche technical domains. Costs 0.05 USDC per call, settled on Solana mainnet in ~400ms via the operator's Phantom Cash address.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "question": {
        "type": "string",
        "minLength": 4,
        "description": "Natural-language question. The vault's RAG layer returns the top-3 most semantically similar snippets with citations to source files."
      },
      "max_price_usdc": {
        "type": "number",
        "default": 0.05,
        "description": "Refuse if the quoted price exceeds this. Defaults to the standard 0.05 USDC."
      }
    },
    "required": ["question"]
  },
  "annotations": {
    "destructiveHint": false,
    "idempotentHint": false,
    "openWorldHint": true
  }
}
```

A few choices in here are non-obvious:

- The description **enumerates the topics in the vault** rather than just saying "expert knowledge". This helps the calling agent's router decide whether to call us at all. If the agent's question is about French cooking, the router should not waste 5 cents.
- `max_price_usdc` lets the calling agent cap its spend per call. The agent's policy layer can set this lower than the default if it wants to skip premium queries.
- `annotations.idempotentHint: false` because retries with a *new* signature charge the buyer again. Idempotency is keyed on the payment signature, not on the query text — see [`x402-on-solana-primer`](./x402-on-solana-primer.md) for the replay-protection caching.

## Transport — stdio vs HTTP

MCP supports two transports.

**Stdio:** the client spawns the MCP server as a subprocess and communicates over stdin/stdout JSON-RPC. This is what Claude Desktop, Cursor, and most local-first IDEs use.

**HTTP:** the client opens an HTTP connection to a URL and sends JSON-RPC requests as POST bodies, optionally streaming via SSE. This is what hosted clients (e.g., a custom agent running in a Cloudflare Worker) use.

Brain Drain ships both transports from a single code base.

```
brain-drain repo
├── packages/mcp-stdio/    ─→ npx-installable stdio bridge
│   └── bin.ts             ─→ shells JSON-RPC over stdio, forwards to HTTP
└── packages/mcp-http/     ─→ deployed at https://brain-drain.dev/mcp/v1
    └── handler.ts         ─→ Hono handler, raw HTTP, gateway to /api/query
```

The stdio package is a thin shim — it accepts JSON-RPC frames on stdio, converts each to an HTTP POST against the public URL, streams the response back. No business logic in the stdio side; everything happens in the HTTP service.

End-user setup is one line per client:

```jsonc
// Claude Desktop config (claude_desktop_config.json)
{
  "mcpServers": {
    "Brain Drain": {
      "command": "npx",
      "args": ["@brain-drain/mcp", "connect"]
    }
  }
}
```

Cursor and Codex have similar config files; same `npx` line.

## The payment dance, inside MCP

When the client calls `brain_drain.query`, the server returns a structured "payment required" response that MCP carries inside its standard error envelope.

```jsonc
// First call — returns 402-equivalent inside MCP error
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32402,                   // mirrors HTTP 402
    "message": "Payment Required",
    "data": {
      "price": {
        "token": "USDC",
        "amount": "0.05",
        "decimals": 6,
        "network": "solana-mainnet",
        "mint": "EPjFWdd5...wyTDt1v",
        "recipient": "2SUm7fDR...PAYMPb3L"
      },
      "facilitator": "https://brain-drain.dev/x402",
      "retry_after_signature": true
    }
  }
}
```

The calling client recognises `code: -32402`, signs the payment via its wallet (CDP, Privy, manual), and retries with the signature attached.

```jsonc
// Retry with signature
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "brain_drain.query",
    "arguments": { "question": "How do I verify Avalanche contracts with Foundry?" },
    "_meta": {
      "x-payment-signature": "5yJ4...ze6Q3aL",
      "x-payment-network": "solana-mainnet",
      "x-payment-token": "USDC"
    }
  }
}
```

The `_meta` field is the standard MCP escape hatch for transport-level metadata. Frames pioneered the `x-payment-signature` convention via their `mcpay` SDK; we follow the same shape for compatibility.

## What the server returns on success

```jsonc
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "When verifying contracts on Avalanche Fuji or mainnet with Foundry, the etherscan endpoint in foundry.toml must be the Routescan v2 URL. The legacy snowtrace.io endpoint silently rejects API keys that start with the rs_ prefix Routescan now issues, and the verification call fails with a non-obvious 403/404 mix. ..."
      }
    ],
    "_meta": {
      "sources": [
        { "id": "01-avalanche-evm/routescan-endpoint-trick.md", "score": 0.794, "heading": "The trick" },
        { "id": "01-avalanche-evm/foundry-vs-hardhat-2026.md", "score": 0.736, "heading": "The Avalanche L1 wrinkle" },
        { "id": "01-avalanche-evm/koza-l1-deployment-lessons.md", "score": 0.712, "heading": "What Koza-L1 is" }
      ],
      "tx_signature": "5yJ4...ze6Q3aL",
      "tx_explorer": "https://explorer.solana.com/tx/5yJ4...ze6Q3aL",
      "price_paid_usdc": 0.05
    }
  }
}
```

Three things in `_meta` that earn their place:

- **`sources`** — every snippet returned cites the file and heading it came from, plus its cosine similarity score. The agent or the human downstream can verify the answer was retrieved, not invented.
- **`tx_signature` + `tx_explorer`** — proof of payment that closes the loop. The agent's policy layer can log these for audit; the human watching the demo video can click the explorer link.
- **`price_paid_usdc`** — exact amount charged, useful for the calling agent's budget tracker.

## Server-side composition

Inside the worker, the call goes through this pipeline:

```ts
// Pseudocode for the handler
async function handleQuery(req: McpQueryRequest): Promise<McpResponse> {
  const sig = req.params._meta?.["x-payment-signature"];
  if (!sig) {
    return mcpError(-32402, "Payment Required", buildInvoice());
  }

  const valid = await verifyPayment(sig, env.SELLER_SOLANA_ADDRESS, env.X402_DEFAULT_PRICE_USDC);
  if (!valid) {
    return mcpError(-32402, "Payment not confirmed", buildInvoice());
  }

  const cached = await env.PAYMENTS_KV.get(sig);
  if (cached) {
    return successResponse(JSON.parse(cached));  // idempotent retry
  }

  const queryVec = await embedText(req.params.arguments.question);
  const top = retrieveTopK(queryVec, await readIndex(), { k: 3 });
  const payload = formatSnippetsForMcp(top, sig);

  await env.PAYMENTS_KV.put(sig, JSON.stringify(payload), { expirationTtl: 7 * 86400 });
  return successResponse(payload);
}
```

Five stages: extract signature → verify → cache check → embed + retrieve → cache + return. Each stage is one function in `src/lib/`; the handler is the only place they compose.

## Cross-references

- [`x402-on-solana-primer`](./x402-on-solana-primer.md) — the underlying payment protocol inside the MCP envelope.
- [`brain-drain-architecture-decisions`](./brain-drain-architecture-decisions.md) — why MCP was the chosen agent surface.
- [`anchor-free-solana-pattern`](./anchor-free-solana-pattern.md) — why no on-chain logic between MCP request and snippet release.
- [`helius-rpc-low-latency-patterns`](./helius-rpc-low-latency-patterns.md) — how `verifyPayment` actually works.
- [Anthropic MCP spec](https://modelcontextprotocol.io) — official reference.
