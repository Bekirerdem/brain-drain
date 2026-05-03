import { resolve } from "node:path";
import { env } from "../env";
import { readIndex } from "./index-store";
import type { IndexFile } from "./types";

let cached: IndexFile | null = null;

export async function getIndex(): Promise<IndexFile> {
  if (cached) return cached;
  const path = resolve(env.RAG_INDEX_PATH);
  cached = await readIndex(path);
  return cached;
}

export function clearIndexCache(): void {
  cached = null;
}
