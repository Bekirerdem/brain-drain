import type { Chunk } from "./types";
import type { RawDocument } from "./loader";

export interface ChunkOptions {
  readonly maxChars?: number;
}

const DEFAULT_MAX_CHARS = 1600;
const HEADING_PATTERN = /^#{1,6}\s+/;
const CODE_FENCE_PATTERN = /^```/;
const PARAGRAPH_JOIN = "\n\n";

interface Section {
  readonly heading: string | null;
  readonly paragraphs: readonly string[];
}

function splitIntoSections(body: string): Section[] {
  const lines = body.split(/\r?\n/);
  const sections: Array<{ heading: string | null; paragraphs: string[] }> = [];
  let currentHeading: string | null = null;
  let currentParas: string[] = [];
  let buffer: string[] = [];
  let inCodeBlock = false;

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const para = buffer.join("\n").trim();
    if (para.length > 0) currentParas.push(para);
    buffer = [];
  };

  const flushSection = () => {
    flushBuffer();
    if (currentHeading !== null || currentParas.length > 0) {
      sections.push({ heading: currentHeading, paragraphs: currentParas });
      currentParas = [];
    }
  };

  for (const line of lines) {
    if (CODE_FENCE_PATTERN.test(line)) inCodeBlock = !inCodeBlock;
    if (!inCodeBlock && HEADING_PATTERN.test(line)) {
      flushSection();
      currentHeading = line.replace(HEADING_PATTERN, "").trim();
      continue;
    }
    if (!inCodeBlock && line.trim() === "") {
      flushBuffer();
      continue;
    }
    buffer.push(line);
  }
  flushSection();
  return sections;
}

function packIntoChunks(paragraphs: readonly string[], maxChars: number): string[] {
  const chunks: string[] = [];
  let buffer = "";
  for (const para of paragraphs) {
    if (buffer.length === 0) {
      buffer = para;
      continue;
    }
    const wouldBe = buffer.length + PARAGRAPH_JOIN.length + para.length;
    if (wouldBe <= maxChars) {
      buffer = `${buffer}${PARAGRAPH_JOIN}${para}`;
    } else {
      chunks.push(buffer);
      buffer = para;
    }
  }
  if (buffer.length > 0) chunks.push(buffer);
  return chunks;
}

export function chunkDocuments(docs: readonly RawDocument[], options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const allChunks: Chunk[] = [];

  for (const doc of docs) {
    const sections = splitIntoSections(doc.body);
    let chunkIndex = 0;
    for (const section of sections) {
      const packed = packIntoChunks(section.paragraphs, maxChars);
      for (const content of packed) {
        allChunks.push({
          id: `${doc.source}#${chunkIndex}`,
          source: doc.source,
          heading: section.heading,
          content,
          charCount: content.length,
          frontmatter: Object.keys(doc.frontmatter).length > 0 ? doc.frontmatter : undefined,
        });
        chunkIndex += 1;
      }
    }
  }
  return allChunks;
}
