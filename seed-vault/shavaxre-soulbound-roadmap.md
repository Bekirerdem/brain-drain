---
title: shavaxre — education crowdfunding with Soulbound NFT roadmap
tags: [avalanche, shavaxre, soulbound, hackathon-veteran]
created: 2026-02-22
updated: 2026-03-15
---

# What shavaxre is

An education crowdfunding platform on Avalanche C-Chain I built for Build Games 2026. Students post study/research goals; donors contribute; a milestone-based release flow disburses funds as goals are verified.

Stack: Hardhat (a client-locked stack at the time), Next.js + ethers, OpenZeppelin contracts.

## The Soulbound NFT idea (post-hackathon)

For v2 I sketched a Soulbound NFT badge issued to each donor when their milestone-conditional contribution releases. The badge is non-transferable (ERC-5192 lockable extension), wallet-bound to the donor address, and accumulates on-chain reputation that future students can use to weight the trust of incoming donors.

## Why Soulbound and not transferable

Donor reputation is the asset. If the badge can be sold, an aggregator could buy reputation in bulk and become a "verified" donor without actually having donated. The non-transferable lock keeps the reputation tied to the actual giving behaviour.

## Where this connects to Brain Drain

The same pattern — a reputation that compounds on the seller side and is wallet-bound — applies to Brain Drain v2. An expert who has answered N queries successfully (with positive judge-LLM ratings) earns a non-transferable "trusted vault" badge. Buyer agents can filter for high-reputation vaults. v0 ignores this; v1 sketches it; v2 ships it.

## Repo

`github.com/Bekirerdem/shavaxre` — Build Games 2026 entry, C-Chain mainnet-ready, Soulbound roadmap documented in `docs/v2.md`.

## Cross-reference

This is the same overall arc as Koza-L1 Template 4 (education-themed L1 starter) — shared lineage, same lessons, different chain configuration.
