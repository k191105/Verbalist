import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { createSession as createSessionHandler } from "./chat/sessionManager";
import { sendMessage as sendMessageHandler } from "./chat/messageHandler";
import { deleteUserAccount } from "./user/accountDeletion";
import { createRevenueCatWebhookHandler } from "./webhooks/revenueCat";
import { sendDailyNotifications } from "./notifications/dailyNotifications";

// Initialize Firebase Admin SDK
admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// Export Firestore instance for use in other modules
export const db = admin.firestore();

// RevenueCat webhook: sync subscription status to Firestore tier
// Configure URL in RevenueCat Dashboard → Integrations → Webhooks
export const revenueCatWebhook = createRevenueCatWebhookHandler(db);

export const helloWorld = onRequest((request, response) => {
  response.send("Hello");
});

export const createChatSession = onCall(
  { secrets: ["OPENAI_API_KEY"] },
  async (request) => {
    const data = request.data;
    const context = request.auth;

    if (!context) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to create a session"
      );
    }

    const { personaId, wordListId } = data;

    if (!personaId || !wordListId) {
      throw new HttpsError(
        "invalid-argument",
        "personaId and wordListId are required"
      );
    }

    const validPersonas = ["chris", "gemma", "eva", "sid"];
    if (!validPersonas.includes(personaId)) {
      throw new HttpsError("invalid-argument", "Invalid personaId");
    }

    try {
      const result = await createSessionHandler(
        db,
        context.uid,
        personaId,
        wordListId
      );
      return result;
    } catch (error) {
      console.error("Error creating session:", error);
      throw new HttpsError("internal", "Failed to create chat session");
    }
  }
);

export const sendChatMessage = onCall(
  { secrets: ["OPENAI_API_KEY"] },
  async (request) => {
    const data = request.data;
    const context = request.auth;

    if (!context) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to send a message"
      );
    }

    const { sessionId, message, retryFromMessageId } = data;

    if (!sessionId || !message) {
      throw new HttpsError(
        "invalid-argument",
        "sessionId and message are required"
      );
    }

    if (typeof message !== "string" || message.length > 500) {
      throw new HttpsError(
        "invalid-argument",
        "Message must be a string of 500 characters or fewer"
      );
    }

    try {
      const result = await sendMessageHandler(
        db,
        sessionId,
        message,
        retryFromMessageId || undefined,
        context.uid
      );
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      throw new HttpsError("internal", "Failed to send message");
    }
  }
);

export { sendDailyNotifications };

export const deleteAccount = onCall(async (request) => {
  const context = request.auth;
  if (!context) {
    throw new HttpsError("unauthenticated", "Must be signed in to delete account");
  }
  try {
    await deleteUserAccount(db, admin.auth(), context.uid);
    return { success: true };
  } catch (error) {
    console.error("Account deletion error:", error);
    throw new HttpsError("internal", "Failed to delete account");
  }
});