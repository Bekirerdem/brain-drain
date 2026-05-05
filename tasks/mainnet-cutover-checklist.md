# Day 7 — Mainnet Cutover Checklist

> **Window:** today (8 May 2026 in roadmap terms; calendar shows 6 May).
> **Goal:** flip from devnet to mainnet-beta with real USDC, verify the
> end-to-end flow, leave a rollback path open until the demo is recorded.

## 0. Pre-flight (do these BEFORE touching env)

- [ ] **GitHub repo public** — confirmed (`Bekirerdem/brain-drain`).
- [ ] **Vercel project linked** — confirm `brain-drain-iota.vercel.app`
      auto-deploys from `master`.
- [ ] **Mainnet Phantom Cash address ready** — paste the Solana address
      where USDC settlements should land. (currently `SELLER_SOLANA_ADDRESS`
      points to a devnet address.)
- [ ] **CDP project mode** — confirm CDP API key has mainnet permission
      (default is devnet-only; check portal → API key → networks).
- [ ] **Mainnet treasury budget** — recommended **$20 USDC**:
      ~80 settlements at $0.25 each = enough for demo + jury test traffic
      with 4× buffer. **$10 minimum** before going live.
- [ ] **Helius mainnet endpoint** — same API key works for both networks;
      just swap subdomain (`devnet.helius-rpc.com` → `mainnet.helius-rpc.com`).

## 1. Environment swap (Vercel production env vars)

Set in Vercel dashboard (Settings → Environment Variables → Production), or
via `vercel env`:

```bash
# critical swaps
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_KEY
SELLER_SOLANA_ADDRESS=<your mainnet Phantom Cash address>

# stays the same (already correct in env)
USDC_MINT_DEVNET=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
USDC_MINT_MAINNET=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
HELIUS_API_KEY=YOUR_HELIUS_KEY
X402_DEFAULT_PRICE_USDC=0.25
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
GEMINI_MODEL=gemini-3.1-pro-preview
GEMINI_FALLBACK_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
RAG_INDEX_PATH=.cache/index.json
NEXT_PUBLIC_APP_URL=https://brain-drain-iota.vercel.app
```

> Keep `Preview` env vars on **devnet** so PR deploys don't burn real USDC.

## 2. CDP buyer wallet on mainnet

The same CDP account works across networks; only the funding step differs.

```bash
# 1. confirm CDP buyer account address (it's deterministic per CDP_WALLET_SECRET)
bun scripts/setup-buyer.ts --network mainnet

# 2. send $20 USDC to that address from your personal wallet (one-time)
#    use Phantom or any Solana wallet. confirm on Solscan.

# 3. confirm mainnet balance
bun scripts/check-balances.ts --network mainnet

# 4. dust-fund the seller ATA so the first payment doesn't pay rent
#    (if seller's USDC ATA doesn't exist yet on mainnet)
bun scripts/seed-seller-ata.ts --network mainnet
```

Most demo scripts probably hard-code `network: "devnet"` in the CDP
transfer call — search for `"devnet"` literals in `scripts/` and parameterize.

## 3. Smoke test on mainnet (before announcing)

```bash
# from your local machine, against the production URL
NEXT_PUBLIC_APP_URL=https://brain-drain-iota.vercel.app \
  bun scripts/buy-query.ts "How do I verify Avalanche L1 contracts with Foundry?"

# expect:
#  - 402 Payment Required with mainnet recipient + $0.25 quote
#  - CDP signs a real mainnet USDC transfer
#  - 200 OK with snippets + tx signature
#  - Solscan confirms the transfer to your Phantom Cash address
```

If anything fails:
- Check Vercel function logs (Vercel → project → Logs → Runtime).
- Helius dashboard for RPC errors / rate-limit hits.
- CDP portal for wallet activity / blocked transfers.

## 4. Real flow recording (for Day 8 demo video)

After the smoke test passes:
1. Open Phantom Cash on mobile, screen-record.
2. Run `buy-query.ts` from your laptop with a real question.
3. Watch the Cash balance tick from current → +$0.25 within ~5 seconds.
4. Open Solscan in a second tab — paste the tx hash returned by the script.
5. Save raw recording for the Day 8 video edit.

## 5. Hardening already shipped (Day 7 morning)

- [x] **RPC retry/backoff** — `src/lib/solana/rpc.ts` now retries 3× with
      exponential backoff (0/250/750 ms) on network errors, 5xx, and 429.
      JSON-RPC logic errors (-32xxx) are NOT retried.
- [x] **TX-not-found inner retry** — `src/lib/solana/verify.ts` retries
      `getParsedTransaction` 4× with 0/400/900/1500 ms backoff while the
      tx propagates.
- [x] **VerifyResult.retryable flag** — downstream callers can decide
      whether to surface a 503 or hard-fail.
- [x] **Web3.js Connection bypass** — verify.ts now uses raw
      JSON-RPC (lighter, retry-aware, no connection pool overhead).
      `connection.ts` deleted.

## 6. Outstanding risks (decide before Day 8)

| Risk | Mitigation |
|---|---|
| Mainnet RPC fails mid-demo | Retry/backoff covers network blips. For longer outages, fallback RPC (QuickNode / Triton) — env-driven, ~30 min to wire if needed. |
| CDP rate limit on demo day | Batch demo queries with delays between (`buy-query.ts` already runs sequentially). |
| Seller ATA doesn't exist | `seed-seller-ata.ts` covers this; run once per mainnet seller. |
| Replay attack (same sig used twice) | x402-next handles this internally. Verified in protocol docs. Document this in Day 9 submission. |
| Phantom Cash UI takes >30s to update | Solscan tx hash is the on-chain proof; Phantom delay is UX, not protocol. Show both in demo video. |

## 7. Rollback path

If something breaks during demo:
1. Vercel dashboard → Environment Variables → flip `SOLANA_NETWORK` back to
   `devnet` and `SOLANA_RPC_URL` to devnet endpoint.
2. Trigger a redeploy (touch any commit or click Redeploy).
3. `~30s` to revert. Demo continues on devnet with note "showing devnet
   for cost reasons" — jury still sees the protocol work.

## 8. Once mainnet is verified

- [ ] Update `docs/roadmap.md` with mainnet sample tx signature.
- [ ] Update `README.md` "Live demo" section with mainnet endpoint.
- [ ] Pin a tweet announcing mainnet (optional but nice — Day 9 prep).
- [ ] Move PR #52 (solana.new MCP catalog) `setup_command` URL to mainnet
      if maintainers haven't merged yet — add a follow-up commit.

## What I need from you

1. **Phantom Cash mainnet address** — paste it here, I'll wire it into env.
2. **CDP API key — does it have mainnet permission**? (check portal)
3. **Treasury funding** — $20 USDC moved to the buyer CDP wallet. Send
   me the tx hash once done so I can confirm balance via the script.
4. **Go/no-go for cutover today** — once 1-3 are ready, I flip env vars
   and run the smoke test. Mainnet live in ~10 minutes after that.
