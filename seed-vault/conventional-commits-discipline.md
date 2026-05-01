---
title: Conventional commits discipline for hackathon repos
tags: [git, hackathon, build-in-public]
created: 2026-04-29
---

# The rule

Every commit on a public hackathon repo is a signal to a future judge. Sloppy commits (`fix stuff`, `wip`, `update`) tell the reviewer that the builder doesn't take the codebase seriously. I enforce Conventional Commits hard:

```
type(scope): subject

body if needed — explain WHY, not WHAT
```

Types I actually use:

- `feat(rag):` — new capability
- `fix(env):` — bug repair
- `refactor(stack):` — restructure without behavior change
- `docs(landscape):` — markdown / docs only
- `chore:` — tooling, deps, build config
- `test:` — test additions

## Why it matters for Brain Drain

Frontier judges open the repo, scan `git log --oneline`, and form a quality impression in 30 seconds. A clean Conventional log looks deliberate; a noisy log looks last-minute.

## What I don't do

- Squash branches before merging — I keep the atomic commits because each one is a checkpoint that runs.
- Amend commits unless I caught a typo before push — once it's in `origin/main` it stays.
- Bypass hooks with `--no-verify` — if the hook fails, I fix the underlying issue.

## Co-authorship

I tag Claude Opus 4.7 explicitly in commits where it wrote the code:

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Honest provenance. The grant reviewers reward this — it's exactly the agentic engineering signal they want to see.
