import * as admin from "firebase-admin";
import { generateChatResponse } from "../llm/openai";
import { buildWindDownInstruction } from "../llm/prompts";

// Constants
const SESSION_LIMITS = {
  softWindDownAt: 15,
  hardEndAt: 20,
};

const CONTEXT_WINDOW_SIZE = 10; // Last N messages for LLM context

// Types
type PersonaId = "chris" | "gemma" | "eva" | "sid";

interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

interface SendMessageResult {
  aiMessage: string;
  sessionStatus: "active" | "complete";
  updatedWordBag: WordBagItem[];
  messageCount: number;
}

/**
 * Detect which target words the user used in their message
 */
function detectWordUsage(message: string, wordBag: WordBagItem[]): string[] {
  const lowerMessage = message.toLowerCase();
  const usedWords: string[] = [];

  for (const item of wordBag) {
    // Match word boundaries (handles plurals, verb forms, etc.)
    const regex = new RegExp(`\\b${item.word.toLowerCase()}\\w*\\b`, "i");
    if (regex.test(lowerMessage)) {
      usedWords.push(item.word);
    }
  }

  return usedWords;
}

/**
 * Update word bag counts based on detected usage
 */
function updateWordBagCounts(
  wordBag: WordBagItem[],
  usedWords: string[]
): WordBagItem[] {
  return wordBag.map((item) => {
    if (usedWords.includes(item.word)) {
      return { ...item, currentUseCount: item.currentUseCount + 1 };
    }
    return item;
  });
}

/**
 * Fetch recent messages for LLM context window
 */
async function fetchContextMessages(
  db: admin.firestore.Firestore,
  sessionId: string,
  limit: number
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const snapshot = await db
    .collection("messages")
    .where("sessionId", "==", sessionId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  // Reverse to get chronological order
  const messages = snapshot.docs.reverse().map((doc) => {
    const data = doc.data();
    return {
      role: data.role as "user" | "assistant",
      content: data.content as string,
    };
  });

  return messages;
}

/**
 * Process an incoming user message and generate AI response
 */
export async function sendMessage(
  db: admin.firestore.Firestore,
  sessionId: string,
  userMessage: string
): Promise<SendMessageResult> {
  // Fetch the session
  const sessionRef = db.collection("chatSessions").doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const session = sessionDoc.data()!;

  // Check if session is already complete
  if (session.status === "complete") {
    throw new Error("Session is already complete");
  }

  const personaId = session.personaId as PersonaId;
  const wordBag = session.wordBag as WordBagItem[];

  // Store user message in Firestore
  const userMsgRef = db.collection("messages").doc();
  const detectedWords = detectWordUsage(userMessage, wordBag);

  await userMsgRef.set({
    id: userMsgRef.id,
    sessionId,
    role: "user",
    content: userMessage,
    timestamp: admin.firestore.Timestamp.now(),
    wordUsage: detectedWords,
  });

  // Update word bag counts
  const updatedWordBag = updateWordBagCounts(wordBag, detectedWords);

  // Fetch context messages (last N)
  const contextMessages = await fetchContextMessages(
    db,
    sessionId,
    CONTEXT_WINDOW_SIZE
  );

  // Add the new user message to context
  contextMessages.push({ role: "user", content: userMessage });

  // Calculate new message count (user message + AI response = +2)
  const newMessageCount = session.messageCount + 2;

  // Build word list for prompt
  const wordList = wordBag.map((w) => w.word);

  // Check if we need wind-down instructions
  const additionalInstructions =
    newMessageCount >= SESSION_LIMITS.softWindDownAt
      ? buildWindDownInstruction()
      : undefined;

  // Generate AI response
  const aiContent = await generateChatResponse({
    personaId,
    wordBag: wordList,
    conversationHistory: contextMessages.map((m) => ({
      ...m,
      role: m.role as "user" | "assistant" | "system",
    })),
    additionalInstructions,
  });

  // Store AI response in Firestore
  const aiMsgRef = db.collection("messages").doc();
  await aiMsgRef.set({
    id: aiMsgRef.id,
    sessionId,
    role: "assistant",
    content: aiContent,
    timestamp: admin.firestore.Timestamp.now(),
  });

  // Determine if session should complete
  const shouldComplete = newMessageCount >= SESSION_LIMITS.hardEndAt;
  const newStatus = shouldComplete ? "complete" : "active";

  // Update session document
  const updateData: Record<string, unknown> = {
    messageCount: newMessageCount,
    wordBag: updatedWordBag,
    contextWindow: admin.firestore.FieldValue.arrayUnion(
      userMsgRef.id,
      aiMsgRef.id
    ),
    status: newStatus,
  };

  if (shouldComplete) {
    updateData.completedAt = admin.firestore.Timestamp.now();
  }

  await sessionRef.update(updateData);

  return {
    aiMessage: aiContent,
    sessionStatus: newStatus,
    updatedWordBag,
    messageCount: newMessageCount,
  };
}
