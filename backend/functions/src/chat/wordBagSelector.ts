import * as admin from "firebase-admin";
import { normalizeWord } from "../srs/wordUtils";

const MAX_BUCKET = 6;

/** Days until next review by bucket (bucket 6 = mastered, no fixed interval) */
const DAYS_UNTIL_REVIEW: Record<number, number> = {
  0: 0,
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30,
  6: 999, // Mastered: low priority, rarely pull in
};

interface SRSStateDoc {
  word: string;
  bucket: number;
  lastReviewed: admin.firestore.Timestamp;
  reviewCount: number;
}

export type SelectionReason = "due" | "new" | "random";

export interface SelectedWord {
  word: string;
  reason: SelectionReason;
}

/**
 * Select words for the word bag using SRS state.
 * Priority 1: Words due for review (past their interval)
 * Priority 2: Words in lower buckets (less mastered)
 * Priority 3: Random from list, avoiding recently seen
 *
 * All words are normalized for consistency with SRS and usage detection.
 * Returns words with selection reason for dev/debugging.
 */
export async function selectWordBag(
  db: admin.firestore.Firestore,
  userId: string,
  wordListId: string,
  words: string[],
  bagSize: number,
  priorityWords: string[] = []
): Promise<SelectedWord[]> {
  const normalizedList = words.map((w) => normalizeWord(w));
  const uniqueWords = [...new Set(normalizedList)].filter((w) => w.length > 0);
  const prioritySet = new Set(priorityWords.map((w) => normalizeWord(w)));

  if (uniqueWords.length === 0) return [];
  const targetSize = Math.min(bagSize, uniqueWords.length);

  type Tier = { word: string; reason: SelectionReason }[];
  const dueForReview: Tier = [];
  const lowBucket: Tier = [];
  const rest: Tier = [];

  const srsSnap = await db
    .collection("srsState")
    .where("userId", "==", userId)
    .where("wordListId", "==", wordListId)
    .get();

  const srsByWord = new Map<string, SRSStateDoc>();
  srsSnap.docs.forEach((d) => {
    const data = d.data();
    srsByWord.set(data.word as string, {
      word: data.word,
      bucket: data.bucket ?? 0,
      lastReviewed: data.lastReviewed,
      reviewCount: data.reviewCount ?? 0,
    });
  });

  if (srsByWord.size === 0) {
    const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5);
    const prioritized = shuffled.filter((w) => prioritySet.has(w));
    const restShuffled = shuffled.filter((w) => !prioritySet.has(w));
    const combined = [...prioritized, ...restShuffled];
    return combined.slice(0, targetSize).map((w) => ({ word: w, reason: "new" as SelectionReason }));
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
    const intervalDays = DAYS_UNTIL_REVIEW[state.bucket] ?? 1;
    const lastMs = state.lastReviewed?.toMillis?.() ?? 0;
    const daysSince = (nowMs - lastMs) / (24 * 60 * 60 * 1000);

    if (daysSince >= intervalDays) {
      dueForReview.push({ word, reason: "due" });
    } else if (state.bucket <= 2) {
      lowBucket.push({ word, reason: "random" }); // Low bucket but not due = fallback
    } else {
      rest.push({ word, reason: "random" });
    }
  }

  const shuffle = <T>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
  const withPriorityFirst = (arr: SelectedWord[]) =>
    arr.sort((a, b) => (prioritySet.has(b.word) ? 1 : 0) - (prioritySet.has(a.word) ? 1 : 0));

  const selected: SelectedWord[] = [];
  const takeFrom = (arr: Tier) => {
    const ordered = withPriorityFirst(shuffle(arr));
    for (const item of ordered) {
      if (selected.length >= targetSize) return;
      if (!selected.some((s) => s.word === item.word)) selected.push(item);
    }
  };

  takeFrom(dueForReview);
  takeFrom(lowBucket);
  takeFrom(rest);

  return selected.slice(0, targetSize);
}
