---
title: Magic byte file verification — never trust the extension
tags: [security, file-handling, gotcha]
created: 2026-04-09
---

# The rule

When changing a font, image, or any binary file's format, verify the magic bytes match the new format. The OS / file system trusts the extension; the parser does not. A `.woff2` extension on what is actually a `.woff` file fails opaquely in browsers — the font request returns 200 OK but the glyphs render as squares.

## How I check

```bash
# Linux / macOS / Git Bash on Windows
file fonts/foo.woff2

# Or hex peek
xxd fonts/foo.woff2 | head -1
```

Magic bytes I keep in muscle memory:

| Format | First bytes (hex) | ASCII |
| :-- | :-- | :-- |
| WOFF | `77 4F 46 46` | `wOFF` |
| WOFF2 | `77 4F 46 32` | `wOF2` |
| TTF | `00 01 00 00` | `(null)(soh)(null)(null)` |
| OTF | `4F 54 54 4F` | `OTTO` |
| PNG | `89 50 4E 47` | `(89)PNG` |
| JPEG | `FF D8 FF` | (jpeg start) |
| GIF | `47 49 46 38` | `GIF8` |
| WebP | `52 49 46 46 ... 57 45 42 50` | `RIFF...WEBP` |
| PDF | `25 50 44 46` | `%PDF` |

## Why this is in the vault

I shipped a portfolio site rework where a designer renamed a `.woff` to `.woff2` thinking it was the same format. Browser console showed font load success; the actual glyphs were system fallback. Took 40 minutes to trace because the file size matched and the network tab was green. `file fonts/foo.woff2` showed `WOFF` — extension lied.

## Generalisation

Whenever a binary file's format is part of a contract (font load, image upload, PDF parse, video transcode), magic-byte verify at the boundary. Extension is a hint, not a guarantee. This is in the same family of mistakes as trusting `Content-Type` headers from clients.
