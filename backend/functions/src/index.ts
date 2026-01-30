import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createSession as createSessionHandler } from "./chat/sessionManager";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export Firestore instance for use in other modules
export const db = admin.firestore();

/**
 * Test function to verify Cloud Functions are working
 * HTTP endpoint that returns "Hello"
 */
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello");
});

/**
 * Create a new chat session
 * Callable function that initializes a chat with word bag
 */
export const createChatSession = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to create a session"
    );
  }

  const { personaId, wordListId } = data;

  // Validate required fields
  if (!personaId || !wordListId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "personaId and wordListId are required"
    );
  }

  // Validate personaId
  const validPersonas = ["chris", "gemma", "eva", "sid"];
  if (!validPersonas.includes(personaId)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid personaId"
    );
  }

  try {
    const result = await createSessionHandler(
      db,
      context.auth.uid,
      personaId,
      wordListId
    );
    return result;
  } catch (error) {
    console.error("Error creating session:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to create chat session"
    );
  }
});
