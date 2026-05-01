import { google } from "@ai-sdk/google";
import { embedMany } from "ai";
import { env } from "../env";

const BATCH_SIZE = 50;

export async function embedTexts(texts: readonly string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const model = google.textEmbeddingModel(env.GEMINI_EMBEDDING_MODEL);
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({ model, values: batch });
    out.push(...embeddings);
  }
  return out;
}

export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  if (!vector) throw new Error("embedText: empty embedding result");
  return vector;
}
