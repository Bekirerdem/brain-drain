---
title: Foundry vs Hardhat in 2026 — what I actually use and why
tags: [foundry, hardhat, evm, tooling, architecture]
created: 2026-03-25
updated: 2026-04-29
---

# My current default

Foundry for everything new. Hardhat only when an existing client repo locks me in or when a deploy graph is unusually complex.

This is the opposite of where I was in 2024 — Hardhat felt safer because the JavaScript-first scripting model was easier to debug. By 2026 the cost difference (test speed, gas profiling, single-binary tooling) made Foundry the clear default for greenfield work.

## Where Foundry wins

### Test speed

Solidity-native tests via `forge test` run 10-50x faster than Hardhat's ts-node + ethers chain at the same coverage. On Koza-L1's Sprint 1 contracts, the full Foundry test suite ran in 2.1 seconds; the equivalent in Hardhat took 28 seconds. That gap compounds when you add fork tests against mainnet state.

```bash
$ forge test
[⠆] Compiling 17 files with 0.8.28
[⠰] Solc 0.8.28 finished in 1.34s
Compiler run successful

Running 31 tests for test/KGAS.t.sol:KGASTest
[PASS] testInitialSupply() (gas: 14583)
[PASS] testMintByValidator() (gas: 73921)
[PASS] testRevertOnNonValidatorMint() (gas: 17302)
...
Test result: ok. 31 passed; 0 failed; 0 skipped; finished in 2.1s
```

### Cheatcodes

`vm.warp(block.timestamp + 7 days)`, `vm.prank(attackerAddress)`, `vm.expectRevert("custom error")`, `vm.deal(addr, 100 ether)` — these read more naturally than the Hardhat equivalents (`hre.network.provider.send("evm_increaseTime", [...])`). Cheatcodes in Foundry are a first-class language feature; in Hardhat they are RPC calls dressed up.

### Gas reports

`forge snapshot` writes a `.gas-snapshot` file with per-test gas usage. CI fails if the snapshot diverges. This is the cleanest gas-regression workflow I have used. Before merging any optimisation, I run `forge snapshot` and review the diff line by line.

```
testMintByValidator: 73921 → 71043 (-2878)
testTransferToHolder: 51200 → 48817 (-2383)
testRevertOnZeroValue: 21456 → 21392 (-64)
```

### Single binary

Foundry installs as one binary (`forge`, `cast`, `anvil`, `chisel`) via `foundryup`. No `node_modules` per project for the tooling itself. Project dependencies (OpenZeppelin, Solmate) live in `lib/` as git submodules, which is a different kind of complexity but at least the toolchain itself is portable.

### Forge script for deploys

`forge script` runs Solidity-native deploy scripts. The same code that deploys the contract can simulate the deploy first (`forge script --rpc-url X`), broadcast it (`forge script --broadcast`), and verify it (`forge script --verify`). One language end to end.

```solidity
// script/Deploy.s.sol
contract Deploy is Script {
    function run() external returns (KGAS kgas) {
        uint256 deployerKey = vm.envUint("DEPLOYER_KEY");
        vm.startBroadcast(deployerKey);

        kgas = new KGAS({
            owner: 0x1234...,
            initialSupply: 1_000_000 ether
        });

        vm.stopBroadcast();
    }
}
```

## Where Hardhat still wins

### Plugin ecosystem

`@openzeppelin/hardhat-upgrades`, `hardhat-deploy`, `hardhat-gas-reporter`, `solidity-coverage`, `hardhat-tracer` — these integrations are still smoother than the Foundry equivalents for non-trivial deployment graphs (proxy patterns, multi-contract dependent deploys, time-based scripts). Foundry's equivalent for proxy upgrades is workable but more manual.

If a project uses transparent proxies with OpenZeppelin's storage-slot validator, Hardhat is still the lower-friction path.

### TypeScript-first scripting

If your deploy script needs to talk to a TypeScript backend, a Postgres database, or an off-chain orchestrator, Hardhat's ts-node integration is less friction than `forge script` plus a separate Node script that calls a JSON-RPC endpoint.

The shavaxre milestone-verifier (where the deploy script writes campaign metadata to a Cloudflare D1 database) was easier in Hardhat for this reason — see [`shavaxre-soulbound-roadmap`](./shavaxre-soulbound-roadmap.md).

### Custom debug tracing

`hardhat-tracer` produces line-by-line execution traces that Foundry's `forge test -vvvv` doesn't quite match for opcode-level analysis. For optimisation deep-dives where I want to see exactly which `MLOAD`s and `SSTORE`s are firing, Hardhat is still the better lens.

## What I no longer use

- **Truffle.** The framework that taught a generation of Solidity devs is now decidedly legacy. Last I checked, the Truffle team had stopped active development.
- **Remix beyond browser sandboxing.** Fine for a one-off contract preview or a quick teaching example. Never for a deploy pipeline.
- **`solc` directly.** Always wrap it in Foundry or Hardhat for the dependency resolution, profile management, and compiler-version pinning.

## Decision matrix

When I start a new EVM project, this is the actual flow I run through:

| Question | If yes → use |
| :-- | :-- |
| Is there an existing client repo on Hardhat? | **Hardhat** |
| Are we using OpenZeppelin transparent proxies? | **Hardhat** (until I trust Foundry's upgrade flow more) |
| Is the deploy script writing to a non-EVM database in the same run? | **Hardhat** |
| Is gas optimisation a primary goal? | **Foundry** |
| Are we deploying to ten or more chains with the same contracts? | **Foundry** (cleaner forge-create scripting) |
| Are we running fuzz tests? | **Foundry** (fuzzer is built in, fast) |
| Does the team or operator have strong Solidity preference? | **Foundry** |
| Is this a clean greenfield? | **Foundry** |

Eight criteria; six lean Foundry. That's why my default is Foundry.

## The Avalanche L1 wrinkle

For Subnet-EVM deployments — Koza-L1, ChainBounty's App-Chain — Foundry needs the chain ID configured per-network in `foundry.toml`, and the `etherscan` block needs the Routescan v2 URL. See [`routescan-endpoint-trick`](./routescan-endpoint-trick.md) for the URL gotcha. With those two settings right, `forge create` and `forge verify-contract` work the same on a custom L1 as on C-Chain mainnet.

## My `foundry.toml` skeleton

This file goes into every new EVM project on day one.

```toml
[profile.default]
src = "src"
test = "test"
out = "out"
libs = ["lib"]
solc_version = "0.8.28"      # pin — never auto-detect for verify
optimizer = true
optimizer_runs = 200
evm_version = "paris"        # PUSH0 only on EVM-compatible chains that support it
fs_permissions = [{ access = "read", path = "./" }]

[profile.ci]
fuzz = { runs = 1024 }       # heavier fuzzing in CI than locally
verbosity = 3

[rpc_endpoints]
mainnet = "${MAINNET_RPC}"
fuji = "${FUJI_RPC}"
avalanche = "${AVALANCHE_RPC}"

[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
fuji = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan" }
avalanche = { key = "${ROUTESCAN_API_KEY}", url = "https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan" }
```

A few non-obvious choices in here:

- `evm_version = "paris"` — earlier than `shanghai` so PUSH0 isn't emitted. PUSH0 breaks on some Subnet-EVMs that haven't enabled it. If you're deploying only to mainnet Ethereum, switch to `shanghai` for the gas savings.
- `fs_permissions` — required for any test that reads a fixture file (e.g., a bytes32 from a JSON). Foundry refuses fs access by default.
- `[profile.ci]` with heavier fuzzing — locally I want fast tests; in CI I want thorough tests.

## Cross-references

- [`routescan-endpoint-trick`](./routescan-endpoint-trick.md) — the etherscan block above only works against the right URL.
- [`koza-l1-deployment-lessons`](./koza-l1-deployment-lessons.md) — full deploy recipe using this `foundry.toml` skeleton on a custom L1.
- [`shavaxre-soulbound-roadmap`](./shavaxre-soulbound-roadmap.md) — example of when Hardhat won (client lock-in + database integration).
- [`chainbounty-icm-pattern`](./chainbounty-icm-pattern.md) — Foundry-based deploy hitting two chains via ICM.
- [`conventional-commits-discipline`](../05-process/conventional-commits-discipline.md) — `forge fmt` in pre-commit hook keeps the diff clean for review.
