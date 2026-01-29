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
