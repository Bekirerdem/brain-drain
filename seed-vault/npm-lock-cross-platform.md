---
title: npm lock cross-platform CI gotcha
tags: [npm, ci, devops, gotcha]
created: 2026-04-08
---

# The bug

A `package-lock.json` generated on Windows fails `npm ci` on Linux runners with `EUNSUPPORTEDPROTOCOL` or `ENOENT` errors that look like missing dependencies. They are not. The optional native deps that npm resolves (e.g., `@rollup/rollup-linux-x64-gnu` vs `@rollup/rollup-win32-x64-msvc`) get pinned to whichever platform generated the lock, and Linux CI cannot resolve the Windows-pinned rolldown variant.

## Fix that always works

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate package-lock cross-platform"
```

Then run `npm ci` on the target CI platform once to confirm. If it passes there, it will pass everywhere — npm 10+ records the platform-conditional optional deps correctly when the lock is regenerated on a Unix-y env.

## Permanent fix

Run `npm install` only inside WSL or a Linux container if you build CI for Linux. Or move to `pnpm` / `bun`, which both handle platform-conditional optionals more deterministically.

## Why this matters for Brain Drain

We deploy to Vercel + Cloudflare (Linux runners). I generate the lock on Windows. If I forget the regen step, the first push to main 502s the build with a vague rollup error. Solo builders hit this twice before they remember it.
