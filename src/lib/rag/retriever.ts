import type { Chunk, IndexEntry, QueryResult } from "./types";

export interface RetrieveOptions {
  readonly k?: number;
  readonly minScore?: number;
}

const DEFAULT_K = 3;

function dot(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v: readonly number[]): number {
  let sum = 0;
  for (const x of v) sum += x * x;
  return Math.sqrt(sum);
}

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

function stripEmbedding(entry: IndexEntry): Chunk {
  const { embedding, ...chunk } = entry;
  void embedding;
  return chunk;
}

export function retrieveTopK(
  queryVector: readonly number[],
  entries: readonly IndexEntry[],
  options: RetrieveOptions = {},
): QueryResult[] {
  const k = options.k ?? DEFAULT_K;
  const minScore = options.minScore;
  const results: QueryResult[] = [];

  for (const entry of entries) {
    const score = cosineSimilarity(queryVector, entry.embedding);
    if (minScore !== undefined && score < minScore) continue;
    results.push({ chunk: stripEmbedding(entry), score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, k);
}
