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
exports.normalizeWord = void 0;
exports.updateWordState = updateWordState;
exports.calculateConfidence = calculateConfidence;
exports.nextBucket = nextBucket;
exports.srsStateId = srsStateId;
const admin = __importStar(require("firebase-admin"));
const wordUtils_1 = require("./wordUtils");
const MAX_BUCKET = 6;
const MIN_BUCKET = 0;
/**
 * Generate a Firestore-safe document ID for SRS state.
 * Format: {userId}_{wordListId}_{normalizedWord}
 */
function srsStateId(userId, wordListId, word) {
    return `${userId}_${wordListId}_${(0, wordUtils_1.normalizeWord)(word)}`;
}
/**
 * Calculate confidence score: (bucket/6) * (correctUses/reviewCount)
 * Returns 0-1.0. When reviewCount is 0, returns bucket/6.
 */
function calculateConfidence(bucket, correctUses, reviewCount) {
    const bucketFactor = bucket / MAX_BUCKET;
    if (reviewCount <= 0) {
        return bucketFactor;
    }
    const accuracyFactor = correctUses / reviewCount;
    return Math.min(1, bucketFactor * accuracyFactor);
}
/**
 * Compute new bucket after a review.
 * - correctlyUsed: true → increment bucket (cap at 6)
 * - correctlyUsed: false → decrement bucket (floor at 0)
 */
function nextBucket(currentBucket, correctlyUsed) {
    if (correctlyUsed) {
        return Math.min(MAX_BUCKET, currentBucket + 1);
    }
    return Math.max(MIN_BUCKET, currentBucket - 1);
}
/**
 * Update or create SRS state for a word after a review.
 * Uses server timestamp (timezone-safe) and transaction (atomic, no lost increments).
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param wordListId Word list ID
 * @param word The word (will be normalized)
 * @param correctlyUsed Whether the user used the word correctly (score >= 6)
 */
async function updateWordState(db, userId, wordListId, word, correctlyUsed) {
    const normalized = (0, wordUtils_1.normalizeWord)(word);
    const docId = srsStateId(userId, wordListId, word);
    const ref = db.collection("srsState").doc(docId);
    const result = await db.runTransaction(async (tx) => {
        var _a, _b, _c;
        const snap = await tx.get(ref);
        let bucket;
        let reviewCount;
        let correctUses;
        if (!snap.exists) {
            bucket = correctlyUsed ? 1 : 0;
            reviewCount = 1;
            correctUses = correctlyUsed ? 1 : 0;
            tx.set(ref, {
                userId,
                wordListId,
                word: normalized,
                bucket,
                lastReviewed: admin.firestore.FieldValue.serverTimestamp(),
                reviewCount,
                correctUses,
                confidence: calculateConfidence(bucket, correctUses, reviewCount),
            });
        }
        else {
            const data = snap.data();
            const currentBucket = (_a = data.bucket) !== null && _a !== void 0 ? _a : 0;
            reviewCount = ((_b = data.reviewCount) !== null && _b !== void 0 ? _b : 0) + 1;
            correctUses = ((_c = data.correctUses) !== null && _c !== void 0 ? _c : 0) + (correctlyUsed ? 1 : 0);
            bucket = nextBucket(currentBucket, correctlyUsed);
            const confidence = calculateConfidence(bucket, correctUses, reviewCount);
            tx.update(ref, {
                bucket,
                lastReviewed: admin.firestore.FieldValue.serverTimestamp(),
                reviewCount,
                correctUses,
                confidence,
            });
        }
        const confidence = calculateConfidence(bucket, correctUses, reviewCount);
        return { bucket, reviewCount, correctUses, confidence };
    });
    return {
        userId,
        wordListId,
        word: normalized,
        bucket: result.bucket,
        lastReviewed: admin.firestore.Timestamp.now(), // Stored value is server timestamp
        reviewCount: result.reviewCount,
        correctUses: result.correctUses,
        confidence: result.confidence,
    };
}
var wordUtils_2 = require("./wordUtils");
Object.defineProperty(exports, "normalizeWord", { enumerable: true, get: function () { return wordUtils_2.normalizeWord; } });
//# sourceMappingURL=algorithm.js.map