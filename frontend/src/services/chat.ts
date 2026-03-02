import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app, "us-central1");

// Types matching backend response shapes
interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
  selectionReason?: "due" | "new" | "random";
}

export interface SRSStateForFrontend {
  word: string;
  bucket: number;
  reviewCount: number;
  correctUses: number;
  confidence: number;
  lastReviewed: string;
}

interface CreateSessionResult {
  sessionId: string;
  wordBag: WordBagItem[];
  firstMessage: string;
}

interface SendMessageResult {
  aiMessages: string[];   // split into multiple bubble-like messages
  aiMessage: string;      // full text (backward compat)
  sessionStatus: "active" | "complete" | "error";
  updatedWordBag: WordBagItem[];
  wordUsageScores: Record<string, number>; // word -> score 1-10
  messageCount: number;
  shouldWindDown?: boolean; // true when between soft and hard limit
  bonusChatEarned?: boolean; // true if this completion earned a bonus chat
  suggestedWords?: string[]; // words to suggest adding on session complete
  errorType?: "ai_unavailable";
  userMessageId?: string;
  srsStates?: SRSStateForFrontend[];
}

/**
 * Start a new chat session by calling the createChatSession Cloud Function
 */
export async function startChatSession(
  personaId: string,
  wordListId: string
): Promise<CreateSessionResult> {
  const createSession = httpsCallable<
    { personaId: string; wordListId: string },
    CreateSessionResult
  >(functions, "createChatSession");

  const result = await createSession({ personaId, wordListId });
  return result.data;
}

/**
 * Check for an active session and resume it
 */
export async function checkActiveSession(
  userId: string
): Promise<{ sessionId: string; personaId: string; wordBag: WordBagItem[]; messages: any[] } | null> {
  const { collection, query, where, getDocs, orderBy, limit } = await import("firebase/firestore");
  const { firestore: db } = await import("./firebase");

  // Query for active sessions for this user
  const sessionsRef = collection(db, "chatSessions");
  const q = query(
    sessionsRef,
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("startedAt", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const sessionDoc = snapshot.docs[0];
  const sessionData = sessionDoc.data();

  // Fetch messages for this session
  const messagesRef = collection(db, "messages");
  const messagesQuery = query(
    messagesRef,
    where("sessionId", "==", sessionDoc.id),
    orderBy("timestamp", "asc")
  );

  const messagesSnapshot = await getDocs(messagesQuery);
  const messages = messagesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate(),
  }));

  return {
    sessionId: sessionDoc.id,
    personaId: sessionData.personaId as string,
    wordBag: sessionData.wordBag || [],
    messages,
  };
}

/**
 * Send a user message and get the AI response
 */
export async function sendUserMessage(
  sessionId: string,
  message: string,
  retryFromMessageId?: string
): Promise<SendMessageResult> {
  const sendMessage = httpsCallable<
    { sessionId: string; message: string; retryFromMessageId?: string },
    SendMessageResult
  >(functions, "sendChatMessage");

  const result = await sendMessage({ sessionId, message, retryFromMessageId });
  return result.data;
}
