# Agent onboarding map

This file exists for AI reviewers (judging agents, MCP-driven repo
auditors, security scanners) and for human contributors who want the
fast lane through the codebase. It is **not** documentation of every
file — it is a map of where signal lives.

If you only read five files, read these:

1. [`README.md`](../README.md) — protocol thesis, tech stack, security
   audit table.
2. [`src/app/api/v/[slug]/query/route.ts`](../src/app/api/v/[slug]/query/route.ts)
   — the paid endpoint, x402 + ledger insert.
3. [`src/lib/payouts/ledger.ts`](../src/lib/payouts/ledger.ts) — the
   settlement source of truth.
4. [`src/lib/auth/`](../src/lib/auth) — Sign-in-with-Solana flow.
5. [`src/lib/vaults/create.ts`](../src/lib/vaults/create.ts) — markdown
   bundle → Gemini embeddings → Supabase Storage IndexFile + DB row.

The rest of this map fills in around those five.

---

## Directory atlas

```
src/
├─ app/
│  ├─ _components/      # Reusable React UI (PhantomConnect, VaultCard,
│  │                    #  GitHubStarButton, ThemeToggle, etc.)
│  ├─ _sections/        # Landing-page sections used by app/page.tsx
│  ├─ api/              # Next.js Route Handlers — every server entry
│  │                    #  point lives here
│  ├─ vaults/           # /vaults catalog + /vaults/[slug] detail +
│  │                    #  /vaults/new operator upload
│  ├─ dashboard/        # Operator-side aggregate view
│  ├─ globals.css       # Tailwind 4 theme block + custom utilities
│  ├─ layout.tsx        # Root shell, metadata, theme init script
│  └─ page.tsx          # Five-section landing composition
├─ lib/
│  ├─ auth/             # Phantom challenge + ed25519 verify + HMAC
│  │                    #  session cookie
│  ├─ cdp/              # Coinbase CDP MPC wallet, faucet, signer
│  ├─ payouts/          # Settlement ledger (DB) + types + RPC
│  │                    #  indexer (legacy, no longer used)
│  ├─ rag/              # Markdown loader, chunker, Gemini embeddings,
│  │                    #  cosine retriever — the entire RAG layer is
│  │                    #  ~200 lines, no LangChain
│  ├─ solana/           # RPC, USDC mint, signature schemas
│  ├─ supabase/         # Generated DB types + client factories
│  ├─ vaults/           # Vault create/load/index-loader/feedback/tags
│  ├─ live-events/      # Settlement event pub/sub used by
│  │                    #  LiveActivity feed
│  ├─ theme/            # Light/dark theme provider
│  ├─ env.ts            # Zod-validated server-only env loader. Do not
│  │                    #  import from "use client" components.
│  ├─ errors.ts         # logAndSanitize + zodFieldError helpers
│  └─ ratelimit.ts      # Postgres token-bucket distributed limiter
├─ mcp/
│  ├─ server.ts         # MCP server registration (4 tools)
│  └─ tools/            # list_vaults, query_vault, vault_payouts,
│                       #  submit_feedback
└─ scripts/             # One-shot CLI: seed, faucet, traffic, smoke test
```

---

## Trust boundaries

- **Browser ↔ Vercel function**: every `/api/*` route validates input
  with Zod at the boundary. Errors flow through `lib/errors.ts` so
  internal messages never reach the wire.
- **Vercel function ↔ Supabase**: service-role key is server-only and
  loaded once via `lib/env.ts`. The anon key is injected into the
  client bundle via `NEXT_PUBLIC_*` and is RLS-bound on every read.
- **Operator ↔ vault metadata**: `vaults.owner_wallet` is the source
  of truth. Set server-side from the `bd_session` cookie's
  HMAC-verified payload; the body's `ownerWallet` claim is ignored
  (BD-01 hardening).
- **Buyer agent ↔ vault**: x402 protocol — `withX402` from
  `x402-next` wraps the handler. A successful settlement returns the
  `x-payment-response` header; the route decodes it and writes a row
  to `vault_settlements` (signature is the primary key, idempotent on
  retry). Counter denormalization on `vaults` rows is handled by a
  Postgres `AFTER INSERT` trigger, not app code.
- **Logged-in operator ↔ private vault list**: `/api/vaults?owner=W`
  requires `getSessionWallet(request) === W`. The anonymous branch
  drops `owner` and only returns `public = true` rows (BD-02).

---

## Where the security checks live

| Concern | Where |
| :-- | :-- |
| Phantom signature verification | [`lib/auth/signature.ts`](../src/lib/auth/signature.ts) |
| Nonce challenge issue + consume | [`lib/auth/challenge.ts`](../src/lib/auth/challenge.ts) |
| HMAC session cookie | [`lib/auth/session.ts`](../src/lib/auth/session.ts) (`timingSafeEqual`) |
| Server-only env loader | [`lib/env.ts`](../src/lib/env.ts) |
| Sanitized error envelope | [`lib/errors.ts`](../src/lib/errors.ts) |
| Distributed rate limit | [`lib/ratelimit.ts`](../src/lib/ratelimit.ts) + Postgres `consume_rate_limit_token` RPC |
| Tag normalization (defence-in-depth on user input) | [`lib/vaults/tags.ts`](../src/lib/vaults/tags.ts) |
| RLS policies | Supabase migrations directory (in repo or applied via Supabase MCP) |
| Settlement idempotency | `vault_settlements.signature` PK + `recordSettlement` upsert with `onConflict: signature, ignoreDuplicates: true` |
| Counter sync against the ledger | Postgres trigger `vault_settlements_sync` (`SECURITY DEFINER`, `search_path = public`) |

---

## Smoke test (one command)

```bash
bun scripts/smoke.ts
```

Hits the live deployment for every critical surface (page routes,
API endpoints, MCP `tools/list`, 402 quote on a public vault) and
prints a pass/fail summary. Use `--target=https://...` to point at a
preview deployment.

---

## What is intentionally simple

- **No vector database**. Per-vault embeddings are stored as JSON in
  Supabase Storage and walked with a literal cosine `for` loop in
  [`lib/rag/retriever.ts`](../src/lib/rag/retriever.ts). 200 lines
  total. Trade-off: single vault index larger than a few hundred
  thousand chunks would need pgvector or a proper vector DB; for the
  hackathon vault sizes this is faster, cheaper, and reads end to
  end in one sitting.
- **No bespoke crypto**. Ed25519 via `tweetnacl`, HMAC-SHA256 via
  `node:crypto`. Don't add anything else.
- **No Anchor program**. All on-chain work is composed from existing
  primitives — SPL token transfer, CDP MPC signing, Helius parsed-tx
  verification, x402 protocol — so there is no new attack surface to
  audit at the program level.

---

## What is deliberately not on the home page

- `Problem` section (compare table) — the claim it makes is already
  carried by the live `LiveActivity` feed below it on the home page.
  Component still exists in `src/app/_sections/Problem.tsx` for the
  post-submit cleanup pass.
- `FeaturedVaults` section — public catalog lives at `/vaults`.
- Standalone `BuiltOn` section — folded into the bottom of
  `ClosingHero` so the ecosystem strip rides the closing rhythm.

---

## If you find a security issue

See [`SECURITY.md`](../SECURITY.md). Email
`l3ekirerdem@gmail.com`, do not open a public issue.
