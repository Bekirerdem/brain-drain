import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";

export interface RawDocument {
  readonly source: string;
  readonly frontmatter: Record<string, unknown>;
  readonly body: string;
}

export interface InMemoryFile {
  readonly source: string;
  readonly content: string;
}

const MARKDOWN_EXTENSIONS = [".md", ".mdx"] as const;
const HIDDEN_PREFIX = ".";

async function* walkMarkdown(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(HIDDEN_PREFIX)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdown(path);
      continue;
    }
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      yield path;
    }
  }
}

export async function loadVault(vaultRoot: string): Promise<RawDocument[]> {
  const documents: RawDocument[] = [];
  for await (const filePath of walkMarkdown(vaultRoot)) {
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    const body = parsed.content.trim();
    if (body.length === 0) continue;
    documents.push({
      source: relative(vaultRoot, filePath).replaceAll("\\", "/"),
      frontmatter: parsed.data as Record<string, unknown>,
      body: parsed.content,
    });
  }
  documents.sort((a, b) => a.source.localeCompare(b.source));
  return documents;
}

/**
 * Builds RawDocument[] from in-memory markdown files (e.g., from an upload
 * route that received a JSON bundle). Same gray-matter parsing + sorting
 * as loadVault, just without filesystem traversal.
 */
export function loadVaultFromFiles(files: readonly InMemoryFile[]): RawDocument[] {
  const documents: RawDocument[] = [];
  for (const file of files) {
    const lower = file.source.toLowerCase();
    if (!MARKDOWN_EXTENSIONS.some((ext) => lower.endsWith(ext))) continue;
    const parsed = matter(file.content);
    const body = parsed.content.trim();
    if (body.length === 0) continue;
    documents.push({
      source: file.source.replaceAll("\\", "/"),
      frontmatter: parsed.data as Record<string, unknown>,
      body: parsed.content,
    });
  }
  documents.sort((a, b) => a.source.localeCompare(b.source));
  return documents;
}
