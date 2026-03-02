import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app, "us-central1");

/**
 * Call Cloud Function to permanently delete user account and all data.
 * This also deletes the Firebase Auth user, so the client will get signed out.
 */
export async function deleteUserAccountCloud(): Promise<void> {
  const fn = httpsCallable(functions, "deleteAccount");
  await fn();
}
