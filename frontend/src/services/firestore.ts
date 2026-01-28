import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
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
  return snap.docs.map((docSnap) => docSnap.data() as WordList);
}
