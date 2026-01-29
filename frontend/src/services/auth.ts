import {
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, firestore } from "./firebase";
import type { User } from "../../../shared/types";

const DEFAULT_WORD_LIST_ID = "template-general";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const ref = doc(firestore, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser: User = {
      id: firebaseUser.uid,
      name: "User",
      createdAt: new Date(),
      activeWordListId: DEFAULT_WORD_LIST_ID,
      tier: "free",
      dailyUsageCount: 0,
      lastResetDate: todayIsoDate(),
      preferences: {
        theme: "light",
        fontSize: "medium",
      },
    };

    await setDoc(ref, {
      ...newUser,
      createdAt: serverTimestamp(),
    });

    return newUser;
  }

  const data = snap.data() as User;
  return { ...data, id: firebaseUser.uid };
}

export function listenToAuthState(
  onUserChange: (user: User | null) => void,
  onError: (error: unknown) => void
) {
  return onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      if (!firebaseUser) {
        onUserChange(null);
        return;
      }

      try {
        const profile = await ensureUserProfile(firebaseUser);
        onUserChange(profile);
      } catch (error) {
        onError(error);
      }
    },
    onError
  );
}

export async function signIn() {
  if (auth.currentUser) {
    return;
  }
  await signInAnonymously(auth);
}

export async function signOut() {
  await firebaseSignOut(auth);
}
