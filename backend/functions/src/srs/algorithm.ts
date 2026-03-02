import * as admin from "firebase-admin";
import { normalizeWord } from "./wordUtils";

const MAX_BUCKET = 6;
const MIN_BUCKET = 0;

/**
 * Generate a Firestore-safe document ID for SRS state.
 * Format: {userId}_{wordListId}_{normalizedWord}
 */
function srsStateId(userId: string, wordListId: string, word: string): string {
  return `${userId}_${wordListId}_${normalizeWord(word)}`;
}

/**
 * Calculate confidence score: (bucket/6) * (correctUses/reviewCount)
 * Returns 0-1.0. When reviewCount is 0, returns bucket/6.
 */
function calculateConfidence(
  bucket: number,
  correctUses: number,
  reviewCount: number
): number {
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
function nextBucket(currentBucket: number, correctlyUsed: boolean): number {
  if (correctlyUsed) {
    return Math.min(MAX_BUCKET, currentBucket + 1);
  }
  return Math.max(MIN_BUCKET, currentBucket - 1);
}

export interface SRSStateData {
  userId: string;
  wordListId: string;
  word: string;
  bucket: number;
  lastReviewed: admin.firestore.Timestamp;
  reviewCount: number;
  correctUses: number;
  confidence: number;
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
export async function updateWordState(
  db: admin.firestore.Firestore,
  userId: string,
  wordListId: string,
  word: string,
  correctlyUsed: boolean
): Promise<SRSStateData> {
  const normalized = normalizeWord(word);
  const docId = srsStateId(userId, wordListId, word);
  const ref = db.collection("srsState").doc(docId);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let bucket: number;
    let reviewCount: number;
    let correctUses: number;

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
    } else {
      const data = snap.data()!;
      const currentBucket = data.bucket ?? 0;
      reviewCount = (data.reviewCount ?? 0) + 1;
      correctUses = (data.correctUses ?? 0) + (correctlyUsed ? 1 : 0);
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

// Export for unit testing and cross-module consistency
export { calculateConfidence, nextBucket, srsStateId };
export { normalizeWord } from "./wordUtils";
