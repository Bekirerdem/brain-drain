import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { IndexFileSchema, type IndexFile } from "./types";

export async function writeIndex(filePath: string, index: IndexFile): Promise<void> {
  IndexFileSchema.parse(index);
  await mkdir(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  await writeFile(tmp, JSON.stringify(index), "utf8");
  await rename(tmp, filePath);
}

export async function readIndex(filePath: string): Promise<IndexFile> {
  const raw = await readFile(filePath, "utf8");
  return IndexFileSchema.parse(JSON.parse(raw));
}
