# 3rd-party tester recruit — outreach scripts

> **Goal:** 1-2 dev (preferably from SendAI / Superteam community) installs
> Brain Drain MCP into Claude Desktop or Cursor, asks a real question,
> records the result. Used as autentic demo evidence in Day 8 video.

## Channels to hit (in priority order)

1. **SendAI / Superteam Discord** — the people building exactly this kind
   of agentic infra. Will care about x402 + RAG specifically.
2. **Colosseum Discord** — fellow hackathon contestants; cross-promotion
   norm in the community.
3. **Tayflab + Koza DAO Telegram** — your trusted inner circle, lowest
   friction, but lowest "outsider authenticity."
4. **Avalanche TR (Hürsel + Team1)** — high warmth but Solana relevance
   is indirect.

## Discord/Telegram message — short version

```
yo — built an x402 + RAG MCP on Solana for the colosseum hackathon. an
agent asks a question, settles 0.25 USDC, gets a cited snippet from my
expert vault. live on devnet rn.

looking for 1-2 ppl to drop the endpoint into claude desktop / cursor,
ask one real question, screen-record the round-trip. takes 10 min.
i'll send you the cdp buyer config + faucet usdc.

interested? endpoint:
https://brain-drain-iota.vercel.app/api/mcp
```

## Discord/Telegram message — longer version (DM follow-up)

```
hey — bekir from the brain drain colosseum project here.

quick context: brain drain is an x402 + RAG reference implementation on
solana. agents discover the tool via MCP, see the price ($0.25), sign a
USDC SPL transfer through CDP, and get top-3 snippets from my expert
markdown vault. ~400ms on-chain confirmation.

what i need from you (10 min):
1. add this to your ~/.config/Claude/claude_desktop_config.json:
   {
     "mcpServers": {
       "brain drain": {
         "transport": "http",
         "url": "https://brain-drain-iota.vercel.app/api/mcp"
       }
     }
   }
2. ask claude something it might want to look up — solana / avalanche /
   foundry / x402 / mcp / rust dev questions land best (vault is mostly
   in those areas).
3. claude should call `brain_drain_query`, you'll see a tx hash come
   back. screen-record that flow.

i'll provide a cdp buyer wallet + devnet usdc faucet so you don't burn
real funds. hackathon submission is may 10, so anytime before may 8
helps a lot.

ping me back if interested — happy to onboard you over a 5-min call.
```

## What to send the tester (after they agree)

A small README with:
1. Claude Desktop config JSON (above)
2. Buyer CDP wallet credentials (one-shot, devnet only — burn after demo)
3. Faucet link or pre-funded wallet
4. Suggested questions that hit the vault well:
   - "How do you verify Avalanche L1 contracts with Foundry?"
   - "Why x402 on Solana over Base?"
   - "Show me the Helius RPC pattern for low-latency confirmation"
   - "What's the anchor-free Solana pattern?"

## Recording instructions for the tester

```
- screen capture the whole thing (loom / quicktime / obs)
- show:
  1. claude desktop chat — your typed question
  2. claude calling brain_drain_query (tool indicator should be visible)
  3. claude's final answer with the snippet quoted
  4. a quick solscan tab showing the tx (i'll give you the link)
- 30-90 seconds is plenty. raw is fine, no editing needed.
```

## Reciprocity offer

Mention you'll:
- Credit them in the demo video + repo README
- Promote their project on your X / Telegram
- Vote for their Colosseum submission if they have one

## Timing

- **Day 7 (May 8):** outreach starts. Find the 1-2 testers.
- **Day 8 (May 9):** receive their recordings, edit into demo video.
- **Day 9 (May 10):** submit.

## Tracking

Keep a list as testers respond:

| Tester | Channel | Status | Tx hash | Recording |
|--------|---------|--------|---------|-----------|
|        |         |        |         |           |
