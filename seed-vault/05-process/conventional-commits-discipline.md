---
title: Conventional commits discipline for hackathon repos
tags: [git, hackathon, build-in-public, process]
created: 2026-04-29
updated: 2026-05-01
---

# The rule

Every commit on a public hackathon repo is a signal to a future judge. Sloppy commits (`fix stuff`, `wip`, `update`, `final final`) tell the reviewer that the builder doesn't take the codebase seriously. I enforce Conventional Commits hard, on every project but especially on the build-in-public ones where the commit log is part of the deliverable.

The discipline pays off in three different audiences: the judge scanning `git log --oneline`, the future contributor who runs `git blame` and wants to understand intent, and the operator (me) who reads back through 2-week-old commits to retrace why a decision was made.

## The format

```
type(scope): subject

optional body
```

Subject is imperative present-tense ("add x", not "added x" or "adding x"), under 72 characters, no trailing period.

Body explains the *why* of the change, not the *what* (the diff already shows the what). Lines wrap at 72 characters. Multiple paragraphs are fine if the change deserves them.

Trailers (`Co-Authored-By:`, `Refs:`, `Fixes:`) live at the bottom, separated from the body by a blank line.

## Types I actually use

| Type | Used for |
| :-- | :-- |
| `feat:` | New capability that didn't exist before |
| `fix:` | Bug repair — the previous code was wrong |
| `refactor:` | Restructure without observable behaviour change |
| `docs:` | Markdown / documentation only |
| `chore:` | Tooling, dependencies, build config — not the application |
| `test:` | Test additions or test infra changes |
| `perf:` | Performance improvement (rare; usually a `refactor` is sufficient) |
| `style:` | Whitespace, formatting, no logic change (rare; rolled into `chore` if anything) |

I deliberately do not use:

- **`build:`** — covered by `chore` for tooling and `feat` for build-system features.
- **`ci:`** — covered by `chore`.
- **`revert:`** — `git revert` writes its own commit message format.

## Scopes I use for Brain Drain

The `(scope)` part is project-dependent. For Brain Drain:

| Scope | Folder / surface |
| :-- | :-- |
| `rag` | `src/lib/rag/*` |
| `env` | `src/lib/env.ts`, `.env.example` |
| `solana` | `src/lib/solana/*` (when added in v0.2) |
| `x402` | `src/lib/x402/*` (when added in v0.2) |
| `mcp` | `src/lib/mcp/*` |
| `dashboard` | `src/app/dashboard/*` |
| `api` | `src/app/api/*` |
| `vault` | `seed-vault/*` |
| `landscape` | `docs/competitive-landscape.md` |
| `grant` | `docs/grant-application.md` |
| `stack` | cross-cutting stack changes (e.g., model swap, dep change) |

A commit that touches multiple scopes drops the scope: `feat: add x402 endpoint with RAG retrieval` (no scope) is fine for a cross-cutting change.

## Why it matters for Brain Drain

Frontier judges open the repo, scan `git log --oneline`, and form a quality impression in 30 seconds. A clean Conventional log looks deliberate; a noisy log looks last-minute.

```bash
# What a judge sees on Brain Drain Day 1 morning:
$ git log --oneline -15
9ac3e98 docs(landscape): competitive analysis from Colosseum Copilot
af9dffe docs(landscape): note MCPay -> Frames rebrand
6a5d7f9 docs(readme): rewrite for hackathon judges + grant reviewers
9e8a088 fix(stack): correct Gemini model ID to gemini-3.1-pro-preview
5569b5b feat(stack): default Gemini model to gemini-3-pro
10a7694 refactor(stack): switch to Gemini-first (free tier) + drop OpenAI
0fc8652 fix(env): correct CDP SDK env vars (CDP_API_KEY_ID/SECRET + WALLET_SECRET)
9836943 chore: scaffold project + docs + env templates
669bf88 Initial commit from Create Next App
```

That log is a story. The judge can read the project's evolution in a minute: scaffolded, fixed CDP env shape, swapped to Gemini stack, fixed model ID, wrote the README, then started the deeper docs. Every commit is an atomic step.

Compare with a hypothetical messy log:

```
9ac3e98 stuff
af9dffe more
6a5d7f9 readme
9e8a088 fix
5569b5b WIP
10a7694 finally working
0fc8652 ENV BUG
9836943 init
```

Same eight commits, same diff content, vastly different reviewer impression. The first version says "I have a process". The second says "I'm racing to the deadline".

## What I don't do

**Squash branches before merging.** I keep the atomic commits because each one is a checkpoint that runs. Squashing collapses the story into a single bullet point, which destroys the build-in-public narrative.

**Amend commits unless I caught a typo before push.** Once the commit is in `origin/main`, it stays. Force-pushing rewrites history and judges who look twice see weirdness.

**Bypass hooks with `--no-verify`.** If the pre-commit hook fails, the underlying issue is the bug, not the hook. I fix the issue and re-stage. The discipline of not bypassing the hook is the discipline.

**Use auto-generated commits.** Git's auto-message ("Update README.md") is meaningless. Always write the message manually.

## Co-authorship attribution

When Claude wrote the code, I attribute Claude in the commit:

```
feat(rag): add Chunk/IndexEntry/IndexFile zod schemas + types

Defines the atomic data shapes for the RAG layer:
- Chunk: a single retrievable markdown fragment ...

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

This is **honest provenance**. Grant reviewers — especially Superteam's Agentic Engineering Grant — reward this explicitly: it tells them I'm using AI tooling at full strength rather than pretending the work is solo-typed.

The trailer follows the GitHub-supported format so co-author attribution surfaces correctly on the GitHub commit view. Multiple co-authors get one trailer line each.

## Pre-commit hook (optional but recommended)

For Brain Drain I run a minimal pre-commit hook:

```bash
#!/bin/bash
# .git/hooks/pre-commit  (or via lefthook / husky)
set -euo pipefail

# Type-check the project before allowing commit
bunx tsc --noEmit

# Verify no .env files are staged (defensive — gitignore should catch this)
if git diff --cached --name-only | grep -E "\.env(\..*)?$" | grep -v "\.env\.example"; then
  echo "Refusing to commit .env files"
  exit 1
fi
```

Catches type errors before they hit `origin/main`. Catches accidental `.env.local` stages before they leak secrets.

## Cross-references

- [`build-in-public-hackathon-strategy`](./build-in-public-hackathon-strategy.md) — why the public commit log is the strongest hackathon signal.
- [`brain-drain-architecture-decisions`](../02-solana-brain-drain/brain-drain-architecture-decisions.md) — every architecture decision is tagged in a commit message.
- [`npm-lock-cross-platform`](../04-devops-gotchas/npm-lock-cross-platform.md) — the regen-lock fix follows this commit format (`chore: regenerate package-lock cross-platform`).
