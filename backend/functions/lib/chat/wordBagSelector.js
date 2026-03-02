"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectWordBag = selectWordBag;
const admin = __importStar(require("firebase-admin"));
const wordUtils_1 = require("../srs/wordUtils");
const MAX_BUCKET = 6;
/** Days until next review by bucket (bucket 6 = mastered, no fixed interval) */
const DAYS_UNTIL_REVIEW = {
    0: 0,
    1: 1,
    2: 3,
    3: 7,
    4: 14,
    5: 30,
    6: 999, // Mastered: low priority, rarely pull in
};
/**
 * Select words for the word bag using SRS state.
 * Priority 1: Words due for review (past their interval)
 * Priority 2: Words in lower buckets (less mastered)
 * Priority 3: Random from list, avoiding recently seen
 *
 * All words are normalized for consistency with SRS and usage detection.
 * Returns words with selection reason for dev/debugging.
 */
async function selectWordBag(db, userId, wordListId, words, bagSize, priorityWords = []) {
    var _a, _b, _c, _d;
    const normalizedList = words.map((w) => (0, wordUtils_1.normalizeWord)(w));
    const uniqueWords = [...new Set(normalizedList)].filter((w) => w.length > 0);
    const prioritySet = new Set(priorityWords.map((w) => (0, wordUtils_1.normalizeWord)(w)));
    if (uniqueWords.length === 0)
        return [];
    const targetSize = Math.min(bagSize, uniqueWords.length);
    const dueForReview = [];
    const lowBucket = [];
    const rest = [];
    const srsSnap = await db
        .collection("srsState")
        .where("userId", "==", userId)
        .where("wordListId", "==", wordListId)
        .get();
    const srsByWord = new Map();
    srsSnap.docs.forEach((d) => {
        var _a, _b;
        const data = d.data();
        srsByWord.set(data.word, {
            word: data.word,
            bucket: (_a = data.bucket) !== null && _a !== void 0 ? _a : 0,
            lastReviewed: data.lastReviewed,
            reviewCount: (_b = data.reviewCount) !== null && _b !== void 0 ? _b : 0,
        });
    });
    if (srsByWord.size === 0) {
        const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5);
        const prioritized = shuffled.filter((w) => prioritySet.has(w));
        const restShuffled = shuffled.filter((w) => !prioritySet.has(w));
        const combined = [...prioritized, ...restShuffled];
        return combined.slice(0, targetSize).map((w) => ({ word: w, reason: "new" }));
    }
    const now = admin.firestore.Timestamp.now();
    const nowMs = now.toMillis();
    for (const word of uniqueWords) {
        const state = srsByWord.get(word);
        if (!state) {
            rest.push({ word, reason: "new" });
            continue;
        }
        if (state.bucket >= MAX_BUCKET) {
            rest.push({ word, reason: "random" });
            continue;
        }
        const intervalDays = (_a = DAYS_UNTIL_REVIEW[state.bucket]) !== null && _a !== void 0 ? _a : 1;
        const lastMs = (_d = (_c = (_b = state.lastReviewed) === null || _b === void 0 ? void 0 : _b.toMillis) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : 0;
        const daysSince = (nowMs - lastMs) / (24 * 60 * 60 * 1000);
        if (daysSince >= intervalDays) {
            dueForReview.push({ word, reason: "due" });
        }
        else if (state.bucket <= 2) {
            lowBucket.push({ word, reason: "random" }); // Low bucket but not due = fallback
        }
        else {
            rest.push({ word, reason: "random" });
        }
    }
    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    const withPriorityFirst = (arr) => arr.sort((a, b) => (prioritySet.has(b.word) ? 1 : 0) - (prioritySet.has(a.word) ? 1 : 0));
    const selected = [];
    const takeFrom = (arr) => {
        const ordered = withPriorityFirst(shuffle(arr));
        for (const item of ordered) {
            if (selected.length >= targetSize)
                return;
            if (!selected.some((s) => s.word === item.word))
                selected.push(item);
        }
    };
    takeFrom(dueForReview);
    takeFrom(lowBucket);
    takeFrom(rest);
    return selected.slice(0, targetSize);
}
//# sourceMappingURL=wordBagSelector.js.map