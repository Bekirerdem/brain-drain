---
title: Magic byte file verification — never trust the extension
tags: [security, file-handling, gotcha, war-story, file-formats]
created: 2026-04-09
updated: 2026-04-29
sources: [bekirerdem.dev portfolio rework session 2026-04-09]
---

# The rule

When changing a font, image, or any binary file's format, verify the **magic bytes** (the first few bytes of the file) match the new format. The OS and file system trust the extension; the parsers that actually consume the file do not. A `.woff2` extension on what is actually a `.woff` file fails opaquely — the font request returns 200 OK, the browser receives the bytes, and the glyphs render as fallback squares because the font parser refused to decode the file.

This is the same family of mistakes as trusting the `Content-Type` header from a client upload, or trusting a filename's extension during a `cp` from one format to another. The right discipline: at every format-sensitive boundary, **verify the bytes, not the metadata**.

## How I check on Linux / macOS / Git Bash

```bash
# The fastest one-liner: file command reads magic bytes and reports format
$ file fonts/foo.woff2
fonts/foo.woff2: Web Open Font Format

$ file fonts/bar.woff2
fonts/bar.woff2: Web Open Font Format (Version 2)
```

The `file` command is decades old, ships in every Unix-derived system, and has a magic-byte database covering hundreds of formats. It tells the truth.

For a quick hex peek:

```bash
$ xxd fonts/foo.woff2 | head -1
00000000: 774f 4646 0001 0000 0000 0000 4f54 5446  wOFF........OTTF
                ^^^^^^^^^
                "wOFF" = WOFF v1 magic bytes — this is NOT WOFF2
```

The first four bytes `77 4F 46 46` spell `wOFF` in ASCII — that's WOFF version 1. WOFF2 starts with `wOF2`. So this file is incorrectly extension-named: it claims to be WOFF2 but it's WOFF.

## Magic bytes I keep in muscle memory

The set I encounter weekly:

| Format | First bytes (hex) | ASCII |
| :-- | :-- | :-- |
| WOFF | `77 4F 46 46` | `wOFF` |
| WOFF2 | `77 4F 46 32` | `wOF2` |
| TTF | `00 01 00 00` | (null bytes) |
| OTF | `4F 54 54 4F` | `OTTO` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `\x89PNG\r\n\x1a\n` |
| JPEG (baseline) | `FF D8 FF E0` | (jpeg start) |
| JPEG (progressive) | `FF D8 FF E2` | (jpeg start) |
| GIF87a | `47 49 46 38 37 61` | `GIF87a` |
| GIF89a | `47 49 46 38 39 61` | `GIF89a` |
| WebP | `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` | `RIFF....WEBP` |
| AVIF | `00 00 00 ?? 66 74 79 70 61 76 69 66` | `....ftypavif` |
| PDF | `25 50 44 46` | `%PDF` |
| ZIP | `50 4B 03 04` | `PK\x03\x04` |
| 7-Zip | `37 7A BC AF 27 1C` | `7z\xbc\xaf'\x1c` |
| MP4 (most variants) | `00 00 00 ?? 66 74 79 70` | `....ftyp` |
| WebM / Matroska | `1A 45 DF A3` | (EBML header) |

The ones with `??` have variable bytes in those positions — for WebP, the file size at offset 4-7; for AVIF and MP4, the box size. Skip those bytes when fingerprinting.

## The portfolio site episode

I was doing the bekirerdem.dev rework in April 2026 (Astro + Cloudflare Pages, see [`portfolio-site`](../05-process/portfolio-site.md)). A designer renamed a `.woff` font file to `.woff2` thinking the formats were interchangeable — they aren't. The browser console showed the font request as `200 OK` (because the server happily served whatever bytes were at the URL with the `.woff2` extension), the network tab was green, the file size was the same as before, but the glyphs on the page rendered as system-font fallbacks.

Forty minutes of spelunking through:

- Checking that the `@font-face` rule referenced the right file ✓
- Inspecting computed style on the affected element ✓ (it claimed the right font)
- Toggling `font-display: swap` thinking it was a flash-of-unstyled-text issue ✗
- Checking Cloudflare Pages cache headers ✗
- Comparing dev mode and production builds ✗
- Finally: `file public/fonts/foo.woff2` → `Web Open Font Format` (not `Version 2`).

The actual fix: take the original WOFF file, run it through a real WOFF2 converter (`fonttools` `ttx2woff2`), generate a real WOFF2 file, replace.

```bash
# Real conversion, not just a rename
pip install fonttools brotli
fonttools ttLib.woff2 compress fonts/foo.woff fonts/foo.woff2
file fonts/foo.woff2
# → Web Open Font Format (Version 2)  ← now it's actually WOFF2
```

## The general pattern

Whenever a binary file's format is part of a contract, verify it at the boundary. Examples:

**Font load (browser).** Browser parsers strict-check magic bytes; mismatches cause silent fallback.

**Image upload (server).** Trusting the client's `Content-Type` header is a security hole — clients can lie. Use a magic-byte library (`file-type` on npm) to confirm what was actually uploaded matches what the route accepts.

```ts
import { fileTypeFromBuffer } from "file-type";

const buffer = await readFileToBuffer(req.body);
const type = await fileTypeFromBuffer(buffer);
if (!type || !["image/png", "image/jpeg", "image/webp"].includes(type.mime)) {
  return res.status(400).json({ error: "Unsupported image format" });
}
// Now you know the bytes match what the extension claimed.
```

**PDF parse / OCR pipeline.** Some "PDFs" are actually ZIP files renamed (Word docs renamed to `.pdf` for confused reasons). The PDF parser will throw; better to fail fast at upload time with a magic-byte check.

**Video transcode.** ffmpeg is forgiving about extensions but the underlying codec detection still happens via magic bytes. A `.mp4` that's actually a `.mkv` succeeds in some pipelines and fails in others, depending on whether the consumer uses the extension or the bytes for routing.

## Why this is in the vault

The class of mistake — trusting an abstraction (extension, header, MIME type) over the underlying bytes — comes up across at least five disciplines (web frontend, server uploads, content pipelines, security review, format conversion). Each discipline names it differently: "MIME confusion", "magic-byte mismatch", "extension lie", "file-format ambiguity". Same bug, different vocabulary.

Generic web docs cover individual cases (browser font parsers, image upload validators) but rarely connect them as one pattern. This page is the connection. An agent retrieving from this vault gets the cross-discipline framing in one shot.

## Cross-references

- [`npm-lock-cross-platform`](./npm-lock-cross-platform.md) — adjacent "trust-the-wrong-abstraction" pattern in dev tooling.
- [`binance-signature-url-ordering-bug`](./binance-signature-url-ordering-bug.md) — adjacent "official guidance is misleading; the bytes are the truth" pattern.
- [`portfolio-site`](../05-process/portfolio-site.md) — the bekirerdem.dev rework session that triggered this note.
- [`build-in-public-hackathon-strategy`](../05-process/build-in-public-hackathon-strategy.md) — silent failures during hackathon demos are catastrophic; magic-byte verification is the right pre-demo check.
