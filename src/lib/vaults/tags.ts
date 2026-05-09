/**
 * Tag normalization for vault domains.
 *
 * Free-form domains were inconsistent — "DeFi", "defi", "De-Fi" all lived
 * side-by-side. Normalization here is the one chokepoint: every write
 * (createVault, future tag edits) flows through `normalizeTags`, so the
 * stored array is always lowercase + hyphen-separated + de-duped.
 */

const TAG_MIN_LENGTH = 2;
const TAG_MAX_LENGTH = 32;
const TAG_MAX_COUNT = 8;

/** Lowercase, replace whitespace+underscores with hyphen, strip illegal chars. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface NormalizeResult {
  readonly tags: string[];
  readonly dropped: { raw: string; reason: string }[];
}

/**
 * Normalize an array of raw tags. Drops empty/too-short/too-long entries
 * with a reason so the caller can surface validation feedback. Caps at
 * TAG_MAX_COUNT in insertion order (first wins on collision).
 */
export function normalizeTags(raw: readonly string[]): NormalizeResult {
  const seen = new Set<string>();
  const tags: string[] = [];
  const dropped: { raw: string; reason: string }[] = [];

  for (const item of raw) {
    if (tags.length >= TAG_MAX_COUNT) {
      dropped.push({ raw: item, reason: `over ${TAG_MAX_COUNT}-tag cap` });
      continue;
    }
    const norm = normalizeTag(item);
    if (norm.length < TAG_MIN_LENGTH) {
      dropped.push({ raw: item, reason: `too short (<${TAG_MIN_LENGTH} chars)` });
      continue;
    }
    if (norm.length > TAG_MAX_LENGTH) {
      dropped.push({ raw: item, reason: `too long (>${TAG_MAX_LENGTH} chars)` });
      continue;
    }
    if (seen.has(norm)) continue;
    seen.add(norm);
    tags.push(norm);
  }

  return { tags, dropped };
}

export const TagLimits = {
  minLength: TAG_MIN_LENGTH,
  maxLength: TAG_MAX_LENGTH,
  maxCount: TAG_MAX_COUNT,
} as const;
