"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWord = normalizeWord;
/**
 * Canonical word normalization used everywhere:
 * - Word bag selection
 * - Usage detection (score matching)
 * - SRS state (doc IDs, storage)
 *
 * Prevents parallel SRS states for the same lexical item (e.g. "Vocabulary" vs "vocabulary").
 */
function normalizeWord(word) {
    return word.toLowerCase().replace(/\//g, "_").trim();
}
//# sourceMappingURL=wordUtils.js.map