---
title: Build-in-public hackathon strategy
tags: [hackathon, strategy, brain-drain, process]
created: 2026-04-30
updated: 2026-05-01
---

# The thesis

For a solo builder in an 11-day window, **the public commit timeline is the strongest signal of quality and momentum a judge can read**. Code quality matters; demo quality matters; but the commit log is the trail of evidence that turns "interesting demo" into "this builder ships".

Optimise for that signal. Then the demo and the code follow.

## The four moves I make on Day 0 of every hackathon

**Move 1: Land a meaningful scaffold on the first push.**

Not a placeholder. The Day-0 push includes a README that pitches the project (problem, solution, sponsor bounty mapping, quickstart), an architecture document with at least one diagram, a roadmap document with the day-by-day plan, the env template with every key explained, and an MIT license. Public from the first commit, not Day 9.

What this signals to the judge: "this person took the repo seriously from the start". What it costs: 2 hours of writing on Day 0 morning. Payoff is non-linear because every later commit is read against the backdrop of "this repo had a plan from the start".

**Move 2: One meaningful commit per substantive change.**

Atomic. Conventional Commit format (see [`conventional-commits-discipline`](./conventional-commits-discipline.md)). The body explains *why*, not *what*. Co-authorship trailer when an LLM wrote the code.

Two commits per file is fine if the changes are different concerns. Eight commits in a single change because of "wip → fix typo → fix typo again" is the failure mode. Stage carefully, write the body carefully, push once.

**Move 3: Public from Day 0, not Day 9.**

Switching from private to public on submission day looks rushed and it's easy to inadvertently surface the half-finished state. Public from the first push tells the judge you trust the work. It also forces the discipline of writing every commit message as if the world is reading it — because the world *is* reading it.

The single legitimate use of `seed-vault/private/` (the gitignore line in Brain Drain's `.gitignore`) is for actually-confidential content; the rest of the repo is public from `git push -u origin main` onward.

**Move 4: Sponsor narrative-fit named explicitly.**

Frontier 2026's heaviest bias is agentic payments (~$135K bounty pool across x402, Phantom Cash, CDP Embedded, AgentPay). Brain Drain hits all four with one MVP. The README's "Sponsor bounties targeted" table names them. Each named bounty is followed by a one-line *how* — what specific feature in the codebase satisfies that bounty.

Generic "we use Solana and stablecoins" doesn't earn a bounty. "Best Use of Phantom CASH — seller payouts surface natively in the Cash tab" earns the bounty.

## The differentiation cut

Cypherpunk 2025 (the immediately-preceding Solana hackathon) produced two x402 winners (MCPay → Frames, CORBITS). The judges have x402-fatigue. They have seen the "agent pays for an API call via x402" demo many times.

My Brain Drain positioning sentence is:

> "MCPay monetises the **tools** AI agents call. Brain Drain monetises the **humans behind those tools**."

Same protocol, **inverted supply side**. The differentiation is human-as-seller plus Phantom Cash as the natural payout surface — neither MCPay nor CORBITS leans on Phantom Cash (see [`phantom-cash-seller-flow`](../02-solana-brain-drain/phantom-cash-seller-flow.md) for why this is the open bounty wedge).

I name competitors directly in the README, not euphemistically. Pretending Frames doesn't exist would be naive; naming Frames and explaining what we do differently shows the judge I did the homework. See `docs/competitive-landscape.md` at the repo root for the full mapping.

## What I don't try to win

**Grand Champion ($30K).** Past Grand Champions (Ore on Renaissance, Reflect on Radar, TAPEDRIVE on Breakout, Unruggable on Cypherpunk) all introduced novel primitives — a new consensus mechanism, a new stablecoin design, a new on-chain storage model, a Solana-native hardware wallet. None of those are achievable in 11 days from a solo Anchor-naïve builder. Targeting Grand Champion would mean compromising the four bounty stack for an unrealistic stretch goal. I stay focused.

**Public Goods Award ($10K) — partial yes.** Brain Drain is partially a public good (Karpathy's LLM Wiki pattern at scale, MIT-licensed, public seed-vault). I will mention this in the submission but not engineer the project around it. The four agentic-payment bounties are higher-probability targets.

**University Award ($10K).** I'm not at a university. Skip.

## What I optimise for instead

**Track prizes (4 × $10K-$25K).** Best Multi-Protocol Agent, Best Use of Phantom CASH, Best Usage of CDP Embedded Wallets, Best AgentPay Demo. All four are within reach of a single MVP, all four are explicit in the README. Even hitting two of four is a 5-figure outcome.

**Honourable Mention pool ($10K each, 20 teams).** This is the volume tier. Even projects that don't win a track prize get a shot at this if the polish and narrative-fit are there. Build-in-public discipline is the most reliable way to earn this.

**Accelerator pipeline.** Colosseum's accelerator interview happens after the hackathon. The repo and submission are reviewed; if the work looks promising, an interview is scheduled. The `$250K pre-seed` for accelerator-accepted teams is the single-largest financial outcome possible from this hackathon. Prepare for the interview as part of the submission.

## Demo video discipline

The 3-minute submission video is the single most-watched artefact a judge sees. Treat it like a product launch, not a hackathon demo.

Structure:

- **0:00-0:10** — hook. The single image that differentiates the project. For Brain Drain: "Bekir's Phantom Cash balance ticks up in real time as agents pay for his expert knowledge".
- **0:10-0:30** — problem statement. Why does this need to exist?
- **0:30-1:30** — live demo. Real query, real payment, real settlement, real snippet returned. No mocked screens.
- **1:30-2:00** — architecture flash. One diagram, ten seconds of voiceover.
- **2:00-2:30** — sponsor bounty mapping. Four logos, four sentences.
- **2:30-3:00** — closing call to action. Repo URL, Twitter handle, accelerator-interview availability.

Record three takes minimum. Cut to the best 30 seconds of each. Subtitles, because half the judges watch on mute.

## What I don't do during the sprint

- **Don't stop to optimise build times.** A 30-second `bun build` is fine. Day 9 is not the time to introduce caching layers.
- **Don't add features past the bounty-fit minimum.** Every extra feature is a risk surface and a context-switch.
- **Don't engage in Twitter / Telegram drama.** Spectator effort is not deliverable.
- **Don't refactor working code.** If it works and ships the bounty, leave it alone until v1.
- **Don't introduce a new dependency on Day 7 or later.** Surprise lockfile drift is the worst thing that can happen near submission.

## What I do every day during the sprint

- **One push to main.** Even on slow days. The commit log shows momentum or it doesn't.
- **Update `docs/roadmap.md` checkbox status.** Visible progress.
- **Tweet a screenshot or commit hash.** Build-in-public is also build-in-Twitter — the judges sometimes find your project from there.
- **Verify the demo end-to-end on devnet.** Don't let the production state silently break.

## The post-hackathon plan

Brain Drain's design assumes the project keeps being useful after the prize is decided. Every architectural decision has been "no Anchor program, no custom token, no proprietary protocol" — which means the repo is also a working agentic-payment reference implementation that other builders can fork.

Post-Frontier roadmap (also a Public Goods narrative point):

1. Multi-seller onboarding (sellers other than me).
2. v1 dispute escrow flow via CDP MPC multisig.
3. Reputation badges (carrying over the [`shavaxre-soulbound-roadmap`](../01-avalanche-evm/shavaxre-soulbound-roadmap.md) Soulbound idea).
4. Eternal hackathon submission with the multi-seller version.

The hackathon is the launch; the project survives.

## Cross-references

- [`conventional-commits-discipline`](./conventional-commits-discipline.md) — the format that makes the commit log readable.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — the technical decisions the build-in-public log is a record of.
- [`phantom-cash-seller-flow`](../02-solana-brain-drain/phantom-cash-seller-flow.md) — the bounty-wedge differentiator named in the README.
- [`portfolio-site`](./portfolio-site.md) — the same build-in-public discipline applied to bekirerdem.dev.
