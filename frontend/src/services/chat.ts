import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app, "us-central1");

// Types matching backend response shapes
interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

interface CreateSessionResult {
  sessionId: string;
  wordBag: WordBagItem[];
  firstMessage: string;
}

interface SendMessageResult {
  aiMessage: string;
  sessionStatus: "active" | "complete";
  updatedWordBag: WordBagItem[];
  messageCount: number;
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
 * Send a user message and get the AI response
 */
export async function sendUserMessage(
  sessionId: string,
  message: string
): Promise<SendMessageResult> {
  const sendMessage = httpsCallable<
    { sessionId: string; message: string },
    SendMessageResult
  >(functions, "sendChatMessage");

  const result = await sendMessage({ sessionId, message });
  return result.data;
}
