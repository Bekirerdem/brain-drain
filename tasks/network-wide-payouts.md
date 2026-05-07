# Network-Wide Payouts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewire `/api/payouts`, the landing `LiveActivity` section, and the `PayoutEvent` schema so the feed shows real-time settlements across **all public vaults** instead of one hardcoded seller — making the multi-vault MVP visible to jurors.

**Architecture:**
- Add `getNetworkPayouts(query)` in `src/lib/payouts/network.ts` that calls `listPublicVaults`, parallel-queries each vault's USDC ATA via the existing service helper, merges results, sorts by `blockTime` desc, and tags each event with `recipient` (operator address) + `vaultSlug`.
- Refactor `getSellerPayouts(query)` → `getSellerPayouts(seller, query, vaultSlug?)` so it can be reused per-vault. The MCP `brain_drain_payouts` tool keeps using it for the platform's own seller.
- Extend `PayoutEvent` schema with `recipient` (always present) and `vaultSlug` (`string | null` for env-fallback / unknown).
- Switch `/api/payouts` and the SSR `LiveActivity` section to `getNetworkPayouts`.
- Update `LiveActivityClient` to render a new "Vault" column linking to `/vaults/<slug>`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase admin client, existing `@solana/web3.js` RPC helpers, zod schemas. Project has **no test runner installed** — verification is dev server + curl + browser per task.

---

## File Structure

**Modify:**
- `src/lib/payouts/types.ts`
- `src/lib/payouts/service.ts`
- `src/lib/payouts/index.ts`
- `src/app/api/payouts/route.ts`
- `src/app/_sections/LiveActivity.tsx`
- `src/app/_components/LiveActivityClient.tsx`
- `src/mcp/server.ts`

**Create:**
- `src/lib/payouts/network.ts`

---

### Task 1: Extend PayoutEvent schema with `recipient` + `vaultSlug`

**Files:**
- Modify: `src/lib/payouts/types.ts`

- [ ] **Step 1: Update schema**

Replace lines 7–15 with:
```ts
export const PayoutEventSchema = z.object({
  signature: z.string(),
  blockTime: z.number().int(),
  slot: z.number().int(),
  payer: SolanaAddressSchema.or(z.literal("unknown")),
  recipient: SolanaAddressSchema,
  vaultSlug: z.string().nullable(),
  amountAtomic: z.string(),
  amountUsdc: z.number(),
  mint: SolanaAddressSchema,
});
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: errors in `service.ts`, `mcp/server.ts`, `LiveActivity.tsx`, `route.ts` flagging the missing fields. These get fixed by Tasks 2–6 below — **do not commit yet**, the codebase will compile cleanly only after Task 6.

---

### Task 2: Refactor `getSellerPayouts` to take a seller arg + emit `recipient`

**Files:**
- Modify: `src/lib/payouts/service.ts`

- [ ] **Step 1: Replace the file with the new signature**

```ts
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { atomicToUsdc, getUsdcMint } from "../solana/usdc";
import {
  getParsedTransaction,
  getSignaturesForAddress,
  type ParsedTransaction,
} from "../solana/rpc";
import type { PayoutEvent, PayoutQuery } from "./types";

const RPC_THROTTLE_MS = 150;

export async function getSellerPayouts(
  seller: string,
  query: PayoutQuery,
  vaultSlug: string | null = null,
): Promise<PayoutEvent[]> {
  const mintAddress = getUsdcMint();
  const sellerAta = getAssociatedTokenAddressSync(
    new PublicKey(mintAddress),
    new PublicKey(seller),
  ).toBase58();

  const signatures = await getSignaturesForAddress(sellerAta, {
    limit: query.limit,
    before: query.before,
  });
  if (signatures.length === 0) return [];

  const events: PayoutEvent[] = [];
  for (const [i, sig] of signatures.entries()) {
    if (i > 0) await sleep(RPC_THROTTLE_MS);
    const tx = await getParsedTransaction(sig.signature);
    if (!tx || tx.meta?.err) continue;
    const event = extractPayout(tx, sig.signature, seller, mintAddress, vaultSlug);
    if (event) events.push(event);
  }
  return events;
}

function extractPayout(
  tx: ParsedTransaction,
  signature: string,
  seller: string,
  mint: string,
  vaultSlug: string | null,
): PayoutEvent | null {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const sellerPost = post.find((b) => b.owner === seller && b.mint === mint);
  if (!sellerPost) return null;

  const sellerPre = pre.find((b) => b.accountIndex === sellerPost.accountIndex);
  const preAmount = BigInt(sellerPre?.uiTokenAmount.amount ?? "0");
  const postAmount = BigInt(sellerPost.uiTokenAmount.amount ?? "0");
  const delta = postAmount - preAmount;
  if (delta <= BigInt(0)) return null;

  const payerCandidate = post.find((b) => b.mint === mint && b.owner !== seller);
  const payer = payerCandidate?.owner ?? "unknown";

  return {
    signature,
    blockTime: tx.blockTime ?? 0,
    slot: tx.slot,
    payer,
    recipient: seller,
    vaultSlug,
    amountAtomic: delta.toString(),
    amountUsdc: atomicToUsdc(delta),
    mint,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

(The previous `import { env } from "../env"` is removed — seller is now a caller responsibility.)

- [ ] **Step 2: Don't commit** — Task 6 lands the full chain.

---

### Task 3: Create `getNetworkPayouts` entry point

**Files:**
- Create: `src/lib/payouts/network.ts`
- Modify: `src/lib/payouts/index.ts`

- [ ] **Step 1: Write `src/lib/payouts/network.ts`**

```ts
import { listPublicVaults } from "@/lib/vaults/load";
import { getSellerPayouts } from "./service";
import type { PayoutEvent, PayoutQuery } from "./types";

const VAULT_SCAN_LIMIT = 24;
const PER_VAULT_SIGNATURE_LIMIT = 10;

export async function getNetworkPayouts(query: PayoutQuery): Promise<PayoutEvent[]> {
  const vaults = await listPublicVaults({ limit: VAULT_SCAN_LIMIT, sort: "recent" });
  if (vaults.length === 0) return [];

  const perVaultLimit = Math.min(query.limit, PER_VAULT_SIGNATURE_LIMIT);
  const results = await Promise.all(
    vaults.map((v) =>
      getSellerPayouts(v.payout_address, { limit: perVaultLimit }, v.slug).catch(
        () => [] as PayoutEvent[],
      ),
    ),
  );

  return results
    .flat()
    .sort((a, b) => b.blockTime - a.blockTime)
    .slice(0, query.limit);
}
```

The `.catch(() => [])` keeps a single bad vault (RPC error, malformed payout address) from breaking the whole feed.

- [ ] **Step 2: Re-export from index**

Replace `src/lib/payouts/index.ts` contents with:
```ts
export * from "./types";
export * from "./service";
export * from "./network";
```

---

### Task 4: Update MCP server (single-seller path keeps working)

**Files:**
- Modify: `src/mcp/server.ts:59`

- [ ] **Step 1: Pass seller + null slug explicitly**

Replace line 59:
```ts
const payouts = await getSellerPayouts(query);
```
with:
```ts
const payouts = await getSellerPayouts(env.SELLER_SOLANA_ADDRESS, query, null);
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: only `route.ts` and `LiveActivity.tsx` errors remain.

---

### Task 5: Switch `/api/payouts` to network-wide

**Files:**
- Modify: `src/app/api/payouts/route.ts`

- [ ] **Step 1: Swap imports + call**

Replace line 3:
```ts
import { getSellerPayouts, PayoutQuerySchema } from "@/lib/payouts";
```
with:
```ts
import { getNetworkPayouts, PayoutQuerySchema } from "@/lib/payouts";
```

Replace line 29:
```ts
const payouts = await getSellerPayouts(query);
```
with:
```ts
const payouts = await getNetworkPayouts(query);
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: only `LiveActivity.tsx` error left.

---

### Task 6: Switch `LiveActivity` SSR to network-wide

**Files:**
- Modify: `src/app/_sections/LiveActivity.tsx`

- [ ] **Step 1: Swap imports + call**

Replace line 2:
```ts
import { getSellerPayouts, type PayoutEvent } from "@/lib/payouts";
```
with:
```ts
import { getNetworkPayouts, type PayoutEvent } from "@/lib/payouts";
```

Replace line 10:
```ts
return await getSellerPayouts({ limit: INITIAL_LIMIT });
```
with:
```ts
return await getNetworkPayouts({ limit: INITIAL_LIMIT });
```

- [ ] **Step 2: Type-check**

Run: `bunx tsc --noEmit`
Expected: clean.

---

### Task 7: Render Vault column + update body copy

**Files:**
- Modify: `src/app/_components/LiveActivityClient.tsx`
- Modify: `src/app/_sections/LiveActivity.tsx`

- [ ] **Step 1: Update the feed table header**

In `LiveActivityClient.tsx`, replace lines 218–223:
```tsx
<div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-4 px-5 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
  <span className="text-eyebrow">Signature</span>
  <span className="text-eyebrow">Payer</span>
  <span className="text-eyebrow text-right">Amount</span>
  <span className="text-eyebrow text-right">Time</span>
</div>
```
with:
```tsx
<div className="grid grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-4 px-5 lg:px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
  <span className="text-eyebrow">Signature</span>
  <span className="text-eyebrow">Vault</span>
  <span className="text-eyebrow">Payer</span>
  <span className="text-eyebrow text-right">Amount</span>
  <span className="text-eyebrow text-right">Time</span>
</div>
```

- [ ] **Step 2: Update FeedRow with Vault cell**

In `LiveActivityClient.tsx`, replace lines 254–286 (the `<li>` block inside `FeedRow`) with:
```tsx
<li
  className={`grid grid-cols-[1.6fr_1.4fr_1.4fr_1fr_0.9fr] gap-4 px-5 lg:px-6 py-3.5 transition-colors duration-300 ${flashClass}`}
>
  <a
    href={solscanTxUrl(row.signature, network)}
    target="_blank"
    rel="noopener noreferrer"
    className="text-mono-tight text-[13px] text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors truncate"
  >
    {truncateSignature(row.signature)}
  </a>
  {row.vaultSlug ? (
    <a
      href={`/vaults/${row.vaultSlug}`}
      className="text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
    >
      {row.vaultSlug}
    </a>
  ) : (
    <a
      href={solscanAddressUrl(row.recipient, network)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-mono-tight text-[13px] text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)] transition-colors truncate"
    >
      {truncateAddress(row.recipient)}
    </a>
  )}
  {row.payer === "unknown" ? (
    <span className="text-mono-tight text-[13px] text-[var(--color-text-faint)] truncate">
      unknown
    </span>
  ) : (
    <a
      href={solscanAddressUrl(row.payer, network)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-mono-tight text-[13px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors truncate"
    >
      {truncateAddress(row.payer)}
    </a>
  )}
  <span className="text-mono-tight text-[13px] text-[var(--color-text)] text-right tabular-nums">
    +${formatUsdc(row.amountUsdc)}
  </span>
  <span className="text-mono-tight text-[12px] text-[var(--color-text-faint)] text-right tabular-nums">
    {timeAgo(row.blockTime, now)}
  </span>
</li>
```

- [ ] **Step 3: Reframe LiveActivity body copy as network-wide**

In `_sections/LiveActivity.tsx`, replace lines 38–43:
```tsx
<p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
  Every paid query is an on-chain SPL transfer from the buyer agent's
  wallet to the vault operator's payout address. The feed below polls{" "}
  <span className="text-mono-tight text-[var(--color-text)]">/api/payouts</span>{" "}
  every 10 seconds — no mocks, no proxies, just Helius parsed-tx truth.
</p>
```
with:
```tsx
<p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
  Every paid query is an on-chain SPL transfer from the buyer agent's
  wallet to a vault operator's payout address. The feed below merges
  settlements across every public vault on the protocol, polling{" "}
  <span className="text-mono-tight text-[var(--color-text)]">/api/payouts</span>{" "}
  every 10 seconds — no mocks, no proxies, just on-chain truth.
</p>
```

- [ ] **Step 4: Type-check + lint**

Run:
```
bunx tsc --noEmit
bun run lint
```
Expected: both clean.

---

### Task 8: End-to-end verification + commit

- [ ] **Step 1: Start the dev server in background**

Run: `bun run dev`
Wait for the "Ready in" line.

- [ ] **Step 2: Hit `/api/payouts` and confirm shape**

Run: `curl -s http://localhost:3000/api/payouts?limit=10`
Expected JSON contains:
```json
{ "count": <n>, "payouts": [ { "signature": "...", "vaultSlug": "...", "recipient": "...", ... } ], "cursor": "..." }
```
At least one payout should have `vaultSlug !== null` (the seed vault). If `count === 0`, the seed vault may not have any payouts yet — proceed to Step 4.

- [ ] **Step 3: Visual check on landing**

Open `http://localhost:3000` in browser. The "Protocol settlements, in real time." section should show a 5-column table (Signature / Vault / Payer / Amount / Time). The Vault cell should link to `/vaults/<slug>`.

- [ ] **Step 4: Trigger a fresh settlement and watch it stream in**

In another terminal: `bun scripts/buy-query.ts "what is x402"`
Wait ≤10 s, watch the feed. New row should flash green on arrival, with `vaultSlug` set.

- [ ] **Step 5: Commit everything**

```
git add src/lib/payouts/ src/app/api/payouts/route.ts src/app/_sections/LiveActivity.tsx src/app/_components/LiveActivityClient.tsx src/mcp/server.ts
git commit -m "feat(payouts): network-wide settlement feed

Refactor payouts service to take seller address as arg, add
getNetworkPayouts that fans out across listPublicVaults and tags
each event with vaultSlug + recipient. /api/payouts and the
landing LiveActivity now show settlements across every public
vault, not just the hardcoded SELLER_SOLANA_ADDRESS. MCP tool
brain_drain_payouts stays single-seller for per-operator queries."
```

---

## Self-review

1. **Spec coverage**
   - Network-wide landing feed → Tasks 5, 6, 7
   - `vaultSlug` + `recipient` tagging → Tasks 1, 2, 3
   - MCP single-seller path preserved → Task 4
   - 5-column UI + body copy reframe → Task 7
   - End-to-end validation → Task 8

2. **Placeholder scan:** no TBD/TODO/"add appropriate"; all code blocks are complete.

3. **Type consistency**
   - `PayoutEvent` fields used identically in `service.ts`, `network.ts`, `LiveActivityClient.tsx`.
   - `getSellerPayouts(seller, query, vaultSlug?)` signature matches in `service.ts`, `mcp/server.ts:59`, `network.ts`.
   - `getNetworkPayouts(query)` matches in `network.ts`, `route.ts`, `LiveActivity.tsx`.
