/**
 * Canonical word normalization used everywhere:
 * - Word bag selection
 * - Usage detection (score matching)
 * - SRS state (doc IDs, storage)
 *
 * Prevents parallel SRS states for the same lexical item (e.g. "Vocabulary" vs "vocabulary").
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/\//g, "_").trim();
}
