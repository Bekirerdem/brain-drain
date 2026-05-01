---
title: Routescan endpoint quirk on Avalanche + Foundry
tags: [avalanche, foundry, verification, gotcha]
created: 2026-03-22
updated: 2026-04-04
---

# The trick

When verifying contracts on Avalanche Fuji (testnet) or mainnet with Foundry, the `etherscan` endpoint in `foundry.toml` **must** be the Routescan v2 URL. The legacy `snowtrace.io` endpoint silently rejects API keys that start with the `rs_` prefix Routescan now issues, and the verification call fails with a non-obvious 403/404 mix.

## What works

```toml
[etherscan]
fuji = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan" }
avalanche = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan" }
```

## What fails

- The old `https://api.snowtrace.io/api` endpoint returns a generic error and the dev wastes 30 minutes thinking it's a flattening issue.
- Solidity compiler version mismatch between `forge build` and Routescan's expected version — pin via `solc_version` in `foundry.toml`, don't trust auto-detection.

## Why I documented this

Lost an entire afternoon on a Koza-L1 deployment because the Foundry book still cites the snowtrace.io URL in its migration guide. Routescan replaced it sometime around mid-2025 but the docs lag. If you see `rs_` in your API key, you're on Routescan; if you see plain hex, you're on the old key — and the old key still works on snowtrace.io but neither key works across both.

## Cross-references

- Used in: Koza-L1 toolkit deployments (Fuji KGAS verified contract).
- Same pattern applies to other Routescan-indexed L1s (Beam, Dexalot subnets).
