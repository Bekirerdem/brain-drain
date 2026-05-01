---
title: MCP server architecture for monetised Solana endpoints
tags: [mcp, solana, brain-drain, architecture]
created: 2026-04-30
---

# What MCP gives us for free

Model Context Protocol is the wire format for tool calls between an LLM client (Claude Desktop, Cursor, Codex) and a server that exposes tools. For Brain Drain, MCP is the agent-side surface: the buyer agent's client speaks MCP; we run an MCP server that exposes one tool, `brain_drain.query`.

## The tool definition

```json
{
  "name": "brain_drain.query",
  "description": "Query Bekir's curated knowledge vault. Costs 0.05 USDC per call, settled on Solana mainnet.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "question": { "type": "string", "minLength": 4 },
      "max_price_usdc": { "type": "number", "default": 0.05 }
    },
    "required": ["question"]
  }
}
```

The price metadata is exposed in the tool description so the agent's policy layer can decide before calling.

## Transport

Stdio for local Claude Desktop, HTTP for Cursor and Codex. I publish two binaries via `npx mcpay` — Stdio mode wraps an HTTP call to our Cloudflare Worker; HTTP mode is the worker itself. The same `/query` endpoint serves both.

## Payment flow inside MCP

1. Client calls `brain_drain.query` with question.
2. MCP server returns a `_meta` field with the 402 invoice.
3. Client wallet (CDP Embedded) auto-funds, signs, sends USDC.
4. Client retries the call with `X-Payment-Signature` set.
5. Server verifies via Helius, runs RAG, returns the snippet.

## Why this matters

Wrapping the payment in MCP means **any** agent client (current and future) speaks the protocol the day they ship MCP support. We're not maintaining one SDK per client — that's MCPay/Frames' job; we just speak their wire format.
