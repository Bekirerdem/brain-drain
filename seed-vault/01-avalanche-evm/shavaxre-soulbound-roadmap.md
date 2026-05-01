---
title: shavaxre — education crowdfunding with a Soulbound NFT roadmap
tags: [avalanche, c-chain, shavaxre, soulbound, hackathon-veteran, architecture]
created: 2026-02-22
updated: 2026-03-15
sources: [Avalanche Build Games 2026 submission]
---

# What shavaxre is

An education crowdfunding platform on Avalanche C-Chain that I built for Build Games 2026. Students post study and research goals, donors contribute USDC, and a milestone-based release flow disburses funds to the student as goals are verified by a small panel.

The hackathon version is fully functional on Fuji with milestone-based releases. The post-hackathon roadmap (the part this note is about) extends it with non-transferable Soulbound NFT badges that build a permanent on-chain reputation for both donors and students.

Stack: Hardhat (a client repo I was already locked into at the time, see [`foundry-vs-hardhat-2026`](./foundry-vs-hardhat-2026.md)), Next.js + ethers, OpenZeppelin contracts.

- **Repo:** `github.com/Bekirerdem/shavaxre`
- **Submission:** Avalanche Build Games 2026 C-Chain track
- **Status:** Fuji-live, mainnet-config ready, Soulbound roadmap in `docs/v2.md`

## How the v0 milestone flow works

Each campaign has three phases.

1. **Pledge phase** — students post a goal (e.g., "fund a six-week machine-learning bootcamp, $1,200 target") with three milestones (`enrolled`, `mid-term passed`, `final completed`). Donors pledge USDC, which is escrowed in the campaign contract.
2. **Verification phase** — when a milestone hits, the student submits proof (a course-completion link, a transcript hash, a video). A small verifier panel — three randomly-selected donors plus the campaign creator — votes on the proof. 3-of-4 votes triggers release of one third of the escrowed funds.
3. **Settlement phase** — funds disburse to the student's address as USDC. If the campaign aborts (no progress in 90 days, donors recall vote passes), funds return to donors pro-rata.

Verification is intentionally lightweight. The point is not airtight fraud detection; the point is a coordination layer that gives donors enough confidence to give without requiring a full bureaucratic apparatus.

## Why Soulbound badges, not transferable NFTs

For v2 I sketched a Soulbound NFT badge issued automatically when a milestone-conditional contribution releases.

```solidity
// IERC5192 lockable extension: badge is locked at mint
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

contract SupporterBadge is ERC721, IERC5192 {
    function _beforeTokenTransfer(
        address from,
        address /* to */,
        uint256 tokenId,
        uint256
    ) internal pure override {
        require(from == address(0), "Soulbound: non-transferable");
    }
    // ...
}
```

The badge is non-transferable (transfers from a non-zero address revert). The `locked()` view returns `true` for every token at all times. This is the ERC-5192 lockable extension — the cleanest way to express Soulbound semantics in 2026.

**Why non-transferable:** donor reputation is the asset. If the badge is sellable, an aggregator could buy reputation in bulk and become a "high-trust" donor without ever giving anything. The Soulbound lock keeps reputation tied to the actual giving behaviour, not to an account's wallet balance.

The same lock applies to milestone-completion badges issued to students. A student's track record of finished campaigns becomes a reputation that future campaigns can reference, but the reputation itself cannot be sold or pooled.

## What goes in the badge metadata

Every badge stores enough on-chain to verify the underlying campaign without external lookups.

```solidity
struct BadgeData {
    uint256 campaignId;
    address recipient;     // student or donor
    uint8 milestoneIdx;    // which of the 3 milestones triggered the mint
    uint256 amountUsd;     // donor: contribution; student: amount unlocked
    uint64 mintedAt;
}
mapping(uint256 => BadgeData) public badges;
```

The IPFS-hosted JSON metadata renders the campaign name, milestone description, and proof reference, but nothing in the JSON is load-bearing — every fact a downstream system might trust is in the on-chain `BadgeData`.

## Reputation aggregation

Future campaigns query the aggregate state via two public views:

```solidity
function donorScore(address donor) external view returns (
    uint256 totalCampaignsBacked,
    uint256 totalUsdContributed,
    uint256 milestonesWitnessed
);

function studentScore(address student) external view returns (
    uint256 totalCampaignsRun,
    uint256 totalMilestonesCompleted,
    uint256 totalUsdReceived
);
```

A frontend consuming these scores can show "this student finished 2 of 3 prior campaigns" or "this donor has supported 17 campaigns over the past 9 months", giving new participants a credible signal without exposing individual transaction history.

## Trade-offs and known issues

**Sybil resistance is partial.** A donor can split capital across multiple wallets to inflate `totalCampaignsBacked`. Mitigation: a future World ID integration to bind one badge per real person. World was sponsoring the Frontier hackathon when I sketched this; their proof-of-personhood is the natural primitive.

**Privacy is not addressed.** Every contribution amount and milestone is on-chain plain. For donors funding sensitive education (medical, legal training, things in restrictive jurisdictions), this is a concern. v3 would add a Tornado-Cash-style private contribution mode, but that's well past v2's scope.

**Verifier collusion.** Three donor verifiers + creator = four votes. A creator who recruits cooperating donors can game milestone releases. Mitigation: verifier rotation per campaign, weighted by inverse `donorScore` (lower-rep donors verify more often, breaking up cliques).

## Why this informs Brain Drain

The same compounding-reputation idea applies to Brain Drain v2.

In Brain Drain, an expert who has answered N queries successfully — judged by an LLM panel for relevance, accuracy, and citation quality — earns a non-transferable "trusted vault" badge. Buyer agents can filter for high-reputation vaults, sort retrievals by reputation-weighted cosine score, or pay premium for Top-tier vaults.

The mechanism transfers cleanly:

| shavaxre v2 | Brain Drain v2 |
| :-- | :-- |
| Donor pledges USDC | Buyer agent pays $0.05 per query |
| Milestone proof | Snippet returned + LLM-judge rating |
| Soulbound donor badge | Soulbound vault-trust badge |
| `donorScore` view | `vaultTrustScore` view, queried before retrieval ranking |

v0 of Brain Drain ignores this. v1 sketches it. v2 ships it, ideally on the same Solana mainnet stack rather than EVM, which would mean a lightweight Anchor program or a CDP MPC-based "lockable" wallet (see [`anchor-free-solana-pattern`](../02-solana-brain-drain/anchor-free-solana-pattern.md)).

## Lineage

shavaxre and Koza-L1 Template 4 (the education-themed L1 template) share the same intellectual ancestry: an education-crowdfunding stack, deployed in two flavours. shavaxre is the C-Chain fast path; Koza-L1 Template 4 is the dedicated-L1 path. Same lessons, different chain configurations.

## Cross-references

- [`koza-l1-deployment-lessons`](./koza-l1-deployment-lessons.md) — Sprint 4 of the toolkit targets the same education-L1 template that shavaxre would consume in dedicated-L1 form.
- [`chainbounty-icm-pattern`](./chainbounty-icm-pattern.md) — sibling Build Games 2026 entry, same off-chain-event + on-chain-settle architecture.
- [`foundry-vs-hardhat-2026`](./foundry-vs-hardhat-2026.md) — why shavaxre is on Hardhat instead of Foundry (client repo lock-in at the time).
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — how shavaxre's reputation ideas inform Brain Drain v2's roadmap.
