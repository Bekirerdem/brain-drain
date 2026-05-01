import { z } from "zod";

export const ChunkSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  heading: z.string().nullable(),
  content: z.string().min(1),
  charCount: z.number().int().positive(),
  frontmatter: z.record(z.string(), z.unknown()).optional(),
});

export const IndexEntrySchema = ChunkSchema.extend({
  embedding: z.array(z.number()).min(1),
});

export const IndexFileSchema = z.object({
  version: z.literal(1),
  model: z.string().min(1),
  dimensions: z.number().int().positive(),
  generatedAt: z.string().datetime(),
  entries: z.array(IndexEntrySchema),
});

export const QueryResultSchema = z.object({
  chunk: ChunkSchema,
  score: z.number().min(-1).max(1),
});

export type Chunk = z.infer<typeof ChunkSchema>;
export type IndexEntry = z.infer<typeof IndexEntrySchema>;
export type IndexFile = z.infer<typeof IndexFileSchema>;
export type QueryResult = z.infer<typeof QueryResultSchema>;

export type Embedding = readonly number[];
