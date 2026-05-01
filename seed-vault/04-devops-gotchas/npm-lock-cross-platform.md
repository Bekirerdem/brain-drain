---
title: npm package-lock cross-platform CI gotcha
tags: [npm, ci, devops, gotcha, war-story, cross-platform]
created: 2026-04-08
updated: 2026-04-29
sources: [debug session 2026-04-08, GitHub Actions failure logs]
---

# The bug

A `package-lock.json` generated on Windows fails `npm ci` on Linux runners with errors that look like missing dependencies. They are not. The optional native dependencies that npm resolves (e.g., `@rollup/rollup-linux-x64-gnu` vs `@rollup/rollup-win32-x64-msvc`, or `@swc/core-linux-x64-gnu` vs `@swc/core-win32-x64-msvc`) get pinned to whichever platform generated the lock, and the Linux CI cannot resolve the Windows-pinned variant.

The error spits out as:

```
npm ERR! code EUNSUPPORTEDPROTOCOL
npm ERR! Unsupported URL Type "workspace:": workspace:*
```

or:

```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /home/runner/work/.../node_modules/@rollup/rollup-linux-x64-gnu/package.json
npm ERR! errno -2
```

Both error messages have nothing to do with the actual problem. The messages point at workspace protocols, missing files, or networking issues, when the real cause is a platform-pinned optional dep that the lock file thinks is mandatory.

## What's happening under the hood

npm's optional-dep resolution since v8 records the platform-conditional install graph. The intent is good: when you `npm install` on Linux, npm fetches `@rollup/rollup-linux-x64-gnu`; when you `npm install` on Windows, it fetches `@rollup/rollup-win32-x64-msvc`; the lock file records both as conditional based on `os` and `cpu`.

The bug: when only one platform's native dep was *actually fetched* during the lock-generating install, the lock file's optional-dep list reflects only that one platform. `npm ci` on a different platform cannot reconstruct the install graph because the lock doesn't acknowledge the alternative variant.

This was patched in npm 11+ but only partially — the lock generation is more conservative now, but pre-existing locks generated on Windows under npm 10 still trip the bug when used on Linux CI under npm 10 or 11.

## Fix that always works

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate package-lock cross-platform"
```

Then run `npm ci` on the target CI platform once to confirm. If it passes there, it'll pass everywhere — npm 10+ records the platform-conditional optional deps correctly when the lock is regenerated on a Unix-y env (Linux or macOS).

The catch: if you run the regen on macOS (because that's your local dev machine), the lock will work on macOS *and* Linux but might still trip on a Windows CI. The reverse-direction lock is more reliable. The actual hierarchy:

| Lock generated on | Works on Linux CI | Works on macOS CI | Works on Windows CI |
| :-- | :-- | :-- | :-- |
| Linux | ✅ | ✅ | ⚠️ usually, but verify |
| macOS | ✅ | ✅ | ⚠️ usually, but verify |
| Windows | ❌ | ❌ | ✅ |

So the sustainable fix is: **don't generate locks on Windows**. If your dev machine is Windows, run the regen inside WSL2 or a Linux container.

## Permanent fixes ranked by effort

**Easy (5 minutes):** Use WSL2 or a Linux container for the npm install, even if everything else dev-side runs in Windows native. The lock you commit was born in Linux; CI is happy.

```bash
# In WSL2 Ubuntu, from the same project directory
rm -rf node_modules package-lock.json
npm install
exit
git add package-lock.json
git commit -m "chore: regenerate package-lock in WSL2"
```

**Medium (one-time):** Move to `pnpm` or `bun`. Both handle platform-conditional optional deps more deterministically.

```bash
# pnpm — single-file workspace, deterministic-by-default
npm uninstall -g pnpm
npm install -g pnpm@latest
pnpm import           # converts package-lock.json to pnpm-lock.yaml
rm package-lock.json
```

```bash
# bun — what Brain Drain uses
bun install           # generates bun.lock
rm package-lock.json  # if migrating
```

I picked Bun for Brain Drain because Bun's lock file (`bun.lock`) has zero recorded cross-platform issues in my experience, and Bun's install is 10-30x faster than npm. The CI pipeline using Bun is `bun install --frozen-lockfile`, which is the equivalent of `npm ci` but reliably platform-portable.

**Hard (don't do this for v0):** Vendor your `node_modules` into the repo (as some teams do). Avoids the lock issue entirely. Costs you ~100MB of repo bloat per stack. Worth it for monorepos with hundreds of services that need to deploy in air-gapped environments. Not worth it for a 17-commit hackathon repo.

## Why this matters for Brain Drain

Brain Drain deploys to Vercel + Cloudflare (Linux runners). I generate the lock on Windows in my standard dev flow. If I forget the regen step before pushing, the first push to `main` 502s the Vercel build with a vague rollup error.

This bit me twice in past projects (bekirerdem.dev portfolio site, ChainBounty frontend). On the third occurrence I wrote this note. Brain Drain Day 0 used `bun install` from the start specifically to avoid the issue, but the note remains valuable for the npm-stack projects I still maintain.

## Adjacent issue: peer-dep mismatches across platforms

Sometimes the cross-platform lock isn't even the problem — instead, npm's peer-dependency resolution differs subtly between platforms because of `engines` field interpretation. If you see warnings like:

```
npm WARN ERESOLVE overriding peer dependency
npm WARN While resolving: ...
```

that pass locally on Windows but fail in CI on Linux, the cause is usually that one of your dependencies declared `engines: { node: ">=20" }` and your local machine has 22 while CI has 20.4. npm's resolver applies different optimisations across platforms. Fix: pin Node version explicitly in `.nvmrc` and reference it in CI.

```bash
# .nvmrc
22.11.0
```

```yaml
# .github/workflows/ci.yml
- uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
```

## Cross-references

- [`conventional-commits-discipline`](../05-process/conventional-commits-discipline.md) — the regen commit follows the same conventional message format.
- [`magic-byte-file-verification`](./magic-byte-file-verification.md) — same family of "trust the wrong abstraction" mistakes.
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — Day-0 builds break loud and visibly when the lock isn't right; this gotcha is exactly the kind of judge-visible disaster that a public commit log preserves.
