import * as admin from "firebase-admin";

const BATCH_LIMIT = 450; // Firestore batch limit is 500

/**
 * Permanently delete all user data and the Auth account.
 */
export async function deleteUserAccount(
  db: admin.firestore.Firestore,
  auth: admin.auth.Auth,
  userId: string
): Promise<void> {
  const toDelete: admin.firestore.DocumentReference[] = [];

  const wordListsSnap = await db.collection("wordLists").where("userId", "==", userId).get();
  wordListsSnap.docs.forEach((d) => toDelete.push(d.ref));

  const sessionsSnap = await db.collection("chatSessions").where("userId", "==", userId).get();
  sessionsSnap.docs.forEach((d) => toDelete.push(d.ref));
  for (const sessionDoc of sessionsSnap.docs) {
    const msgSnap = await db.collection("messages").where("sessionId", "==", sessionDoc.id).get();
    msgSnap.docs.forEach((d) => toDelete.push(d.ref));
  }

  const srsSnap = await db.collection("srsState").where("userId", "==", userId).get();
  srsSnap.docs.forEach((d) => toDelete.push(d.ref));

  toDelete.push(db.collection("users").doc(userId));

  for (let i = 0; i < toDelete.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    toDelete.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  await auth.deleteUser(userId);
}
