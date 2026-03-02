import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { User, WordList } from "../../../shared/types";

export async function getUserProfile(userId: string): Promise<User | null> {
  const ref = doc(firestore, "users", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as User) : null;
}

export async function getWordList(wordListId: string): Promise<WordList | null> {
  const ref = doc(firestore, "wordLists", wordListId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as WordList) : null;
}

export async function getTemplateWordLists(): Promise<WordList[]> {
  const ref = collection(firestore, "wordLists");
  const q = query(ref, where("isTemplate", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    ...docSnap.data(),
    id: docSnap.id,
  } as WordList));
}

export async function updateActiveWordList(
  userId: string,
  wordListId: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  await updateDoc(ref, { activeWordListId: wordListId });
}

export async function updateUserName(
  userId: string,
  name: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  await updateDoc(ref, { name });
}

export async function updateUserTier(
  userId: string,
  tier: "free" | "premium"
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  await updateDoc(ref, { tier });
}

export async function updateUserPreferences(
  userId: string,
  updates: { themeName?: string; theme?: string }
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  const data: Record<string, unknown> = {};
  if (updates.themeName !== undefined) data["preferences.themeName"] = updates.themeName;
  if (updates.theme !== undefined) data["preferences.theme"] = updates.theme;
  if (Object.keys(data).length === 0) return;
  await updateDoc(ref, data);
}

export async function addWordToUserPriority(
  userId: string,
  word: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const current: string[] = data.priorityWords || [];
  if (current.includes(word.toLowerCase())) return;
  const updated = [...current, word.toLowerCase()];
  await updateDoc(ref, { priorityWords: updated });
}

export interface SRSStateDoc {
  word: string;
  bucket: number;
  reviewCount: number;
  correctUses: number;
  confidence: number;
  lastReviewed: { toDate: () => Date };
}

export async function getSRSStates(
  userId: string,
  wordListId: string,
  words: string[]
): Promise<SRSStateDoc[]> {
  if (words.length === 0) return [];
  const wordSet = new Set(words.map((w) => w.toLowerCase()));

  const { collection, query, where, getDocs } = await import("firebase/firestore");
  const q = query(
    collection(firestore, "srsState"),
    where("userId", "==", userId),
    where("wordListId", "==", wordListId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data())
    .filter((d) => wordSet.has((d.word as string).toLowerCase()))
    .map((d) => ({
      word: d.word as string,
      bucket: (d.bucket as number) ?? 0,
      reviewCount: (d.reviewCount as number) ?? 0,
      correctUses: (d.correctUses as number) ?? 0,
      confidence: (d.confidence as number) ?? 0,
      lastReviewed: d.lastReviewed as { toDate: () => Date },
    }));
}

export async function removeWordFromUserPriority(
  userId: string,
  word: string
): Promise<void> {
  const ref = doc(firestore, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const current: string[] = data.priorityWords || [];
  const wordLower = word.toLowerCase();
  const updated = current.filter((w) => w !== wordLower);
  await updateDoc(ref, { priorityWords: updated });
}

export async function createCustomWordList(
  userId: string,
  name: string,
  words: string[]
): Promise<string> {
  const ref = collection(firestore, "wordLists");
  const newList = {
    name,
    isTemplate: false,
    userId,
    createdAt: serverTimestamp(),
    words,
    wordCount: words.length,
    description: `Custom word list with ${words.length} words`,
  };
  
  const docRef = await addDoc(ref, newList);
  return docRef.id;
}

export async function updateWordList(
  wordListId: string,
  updates: { words?: string[]; name?: string }
): Promise<void> {
  const ref = doc(firestore, "wordLists", wordListId);
  const data: Record<string, unknown> = {};
  if (updates.words !== undefined) {
    data.words = updates.words;
    data.wordCount = updates.words.length;
  }
  if (updates.name !== undefined) {
    data.name = updates.name;
  }
  await updateDoc(ref, data);
}

export async function createAndSetCustomWordList(
  userId: string,
  name: string,
  words: string[]
): Promise<string> {
  // Create the word list
  const wordListId = await createCustomWordList(userId, name, words);
  
  // Set it as the active word list
  await updateActiveWordList(userId, wordListId);
  
  return wordListId;
}
