#!/usr/bin/env bun
import { env } from "../src/lib/env";
import {
  chunkDocuments,
  embedTexts,
  loadVault,
  writeIndex,
  type IndexFile,
} from "../src/lib/rag";

interface CliArgs {
  readonly vault: string;
  readonly out: string;
  readonly maxChars?: number;
}

const DEFAULT_VAULT = "./seed-vault";
const DEFAULT_OUT = "./.cache/index.json";

function parseArgs(argv: readonly string[]): CliArgs {
  let vault: string | undefined;
  let out: string | undefined;
  let maxChars: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];
    if (flag === "--vault" || flag === "-v") {
      vault = next;
      i += 1;
    } else if (flag === "--out" || flag === "-o") {
      out = next;
      i += 1;
    } else if (flag === "--max-chars") {
      maxChars = Number(next);
      i += 1;
    }
  }
  return {
    vault: vault ?? DEFAULT_VAULT,
    out: out ?? DEFAULT_OUT,
    maxChars,
  };
}

async function main(): Promise<void> {
  const cli = parseArgs(process.argv.slice(2));
  const t0 = Date.now();

  console.log(`[seed] loading vault: ${cli.vault}`);
  const docs = await loadVault(cli.vault);
  console.log(`[seed] documents: ${docs.length}`);
  if (docs.length === 0) {
    console.error(`[seed] no markdown found in ${cli.vault} — aborting`);
    process.exit(1);
  }

  const chunks = chunkDocuments(docs, { maxChars: cli.maxChars });
  console.log(`[seed] chunks: ${chunks.length}`);
  if (chunks.length === 0) {
    console.error("[seed] no chunks produced — aborting");
    process.exit(1);
  }

  console.log(`[seed] embedding via ${env.GEMINI_EMBEDDING_MODEL}`);
  const tEmbed = Date.now();
  const embeddings = await embedTexts(chunks.map((c) => c.content));
  console.log(`[seed] embeddings: ${embeddings.length} in ${Date.now() - tEmbed}ms`);

  if (embeddings.length !== chunks.length) {
    throw new Error(`embedding count mismatch: ${embeddings.length} vs ${chunks.length}`);
  }
  const first = embeddings[0];
  if (!first || first.length === 0) {
    throw new Error("first embedding is empty");
  }

  const index: IndexFile = {
    version: 1,
    model: env.GEMINI_EMBEDDING_MODEL,
    dimensions: first.length,
    generatedAt: new Date().toISOString(),
    entries: chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] as number[] })),
  };

  await writeIndex(cli.out, index);
  console.log(`[seed] wrote ${cli.out} (dim=${first.length}, total ${Date.now() - t0}ms)`);
}

main().catch((error) => {
  console.error("[seed] FAIL:", error);
  process.exit(1);
});
