---
title: ChainBounty — cross-chain bounty pattern using Avalanche ICM
tags: [avalanche, icm, chainbounty, hackathon-veteran, cross-chain]
created: 2026-02-15
updated: 2026-03-30
---

# What ChainBounty is

A cross-chain bounty payout system I shipped for Avalanche Build Games 2026: bounties posted on the C-Chain settle to bounty hunters on a dedicated App-Chain (custom Subnet-EVM L1) via Avalanche Inter-Chain Messaging (ICM, formerly AWM/Teleporter).

Stack: Foundry contracts, Next.js + Wagmi frontend, ICM relayer running between C-Chain and the App-Chain.

## The core idea

Bounty issuers want low fees and isolation (App-Chain), but bounty hunters want the liquidity of mainnet (C-Chain). ICM lets us keep both: post on C-Chain, claim on App-Chain, and the bounty token bridges automatically when the hunter submits proof.

## What I learned about ICM

**Relayer ordering is not guaranteed.** Two messages from C-Chain to the App-Chain in quick succession can arrive in any order. The receiver contract must use a `nonce` from the source chain and refuse out-of-order messages, or stale claims overwrite valid ones.

**Gas on the destination is a separate problem.** The receiver chain needs the receiver contract pre-funded with native gas to execute the inbound message. Forgetting this is the first thing that breaks demo-time.

**The off-chain relayer is a single point of failure for v0.** ChainBounty runs one relayer in a Cloud Run container; if it crashes during a demo, claims sit in limbo. v1 plan: subscribe to the source-chain `MessageSent` event from a backup relayer so we have redundancy.

## Why this informs Brain Drain

The "verifier-as-a-service" pattern from ChainBounty (off-chain proof + on-chain settlement) is exactly what Brain Drain's x402 middleware does — just with a Helius RPC poll instead of an ICM relayer.

## Repo

`github.com/Bekirerdem/ChainBounty` — Foundry-based, Wagmi UI, Build Games 2026 entry.
