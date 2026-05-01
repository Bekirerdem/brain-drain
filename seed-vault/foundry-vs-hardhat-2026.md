---
title: Foundry vs Hardhat in 2026 — what I actually use and why
tags: [foundry, hardhat, evm, tooling]
created: 2026-03-25
updated: 2026-04-29
---

# My current default

Foundry for everything new. Hardhat only when an existing client repo locks me in.

## What Foundry wins on

- **Test speed** — Solidity-native tests via `forge test` run 10-50x faster than Hardhat's ts-node + ethers chain at the same coverage.
- **Cheatcodes** — `vm.warp`, `vm.prank`, `vm.expectRevert` cover state manipulation that Hardhat's `hre.network.provider` exposes more verbosely.
- **Gas reports** — `forge snapshot` + `forge test --gas-report` is the cleanest gas-regression workflow I've used.
- **Single binary** — install Foundry once, no `node_modules` per project for tooling.

## What Hardhat still wins on

- **Plugin ecosystem** — `@openzeppelin/hardhat-upgrades`, `hardhat-deploy`, `hardhat-gas-reporter` integrations are still smoother than the Foundry equivalents for non-trivial deployment graphs.
- **TypeScript-first scripting** — if your deploy script needs to talk to a TypeScript backend / database / off-chain orchestrator, Hardhat's ts-node integration is less friction than `forge script` + Anvil.

## What I no longer use

- **Truffle** — gone.
- **Remix beyond browser sandboxing** — fine for a one-off contract preview, never for a deploy pipeline.

## The Avalanche L1 wrinkle

For Subnet-EVM deployments (Koza-L1, ChainBounty App-Chain), Foundry needs the chain ID configured per-network in `foundry.toml`, and the `etherscan` block needs the Routescan v2 URL — see [routescan-endpoint-trick] for the URL gotcha. With those two settings right, `forge create` and `forge verify-contract` work the same on a custom L1 as on C-Chain.

## My `foundry.toml` skeleton

```toml
[profile.default]
src = "src"
test = "test"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
fuji = "${FUJI_RPC}"
avalanche = "${AVALANCHE_RPC}"

[etherscan]
fuji = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan" }
avalanche = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan" }
```

This is the file I copy into every new EVM project as the starting point.
