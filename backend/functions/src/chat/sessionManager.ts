import * as admin from "firebase-admin";

// Constants (inlined to avoid cross-directory import issues during build)
const WORD_BAG_SIZE = {
  min: 3,
  max: 5,
};

// Types (inline to avoid import issues with shared folder during build)
type PersonaId = "chris" | "gemma" | "eva" | "sid";
type SessionStatus = "active" | "complete";

interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

interface ChatSession {
  id: string;
  userId: string;
  personaId: PersonaId;
  wordListId: string;
  status: SessionStatus;
  startedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  messageCount: number;
  wordBag: WordBagItem[];
  contextWindow: string[];
}

interface WordList {
  id: string;
  name: string;
  words: string[];
}

interface CreateSessionResult {
  sessionId: string;
  wordBag: WordBagItem[];
  firstMessage: string;
}

/**
 * Select random words for the word bag (no SRS yet)
 */
function selectRandomWords(words: string[], count: number): string[] {
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Create a word bag with target use counts
 */
function createWordBag(words: string[]): WordBagItem[] {
  return words.map((word) => ({
    word,
    targetUseCount: 1,
    currentUseCount: 0,
  }));
}

/**
 * Create a new chat session
 */
export async function createSession(
  db: admin.firestore.Firestore,
  userId: string,
  personaId: PersonaId,
  wordListId: string
): Promise<CreateSessionResult> {
  // Fetch the word list
  const wordListDoc = await db.collection("wordLists").doc(wordListId).get();

  if (!wordListDoc.exists) {
    throw new Error(`Word list ${wordListId} not found`);
  }

  const wordList = wordListDoc.data() as WordList;

  // Select random words for the word bag (3-5 words)
  const bagSize =
    Math.floor(Math.random() * (WORD_BAG_SIZE.max - WORD_BAG_SIZE.min + 1)) +
    WORD_BAG_SIZE.min;
  const selectedWords = selectRandomWords(wordList.words, bagSize);
  const wordBag = createWordBag(selectedWords);

  // Create the session document
  const sessionRef = db.collection("chatSessions").doc();
  const session: ChatSession = {
    id: sessionRef.id,
    userId,
    personaId,
    wordListId,
    status: "active",
    startedAt: admin.firestore.Timestamp.now(),
    messageCount: 0,
    wordBag,
    contextWindow: [],
  };

  await sessionRef.set(session);

  // Placeholder first message (OpenAI integration in 5.3)
  const firstMessage = `Hey! I'd love to chat with you. What's on your mind today?`;

  // Store the first message
  const messageRef = db.collection("messages").doc();
  await messageRef.set({
    id: messageRef.id,
    sessionId: sessionRef.id,
    role: "assistant",
    content: firstMessage,
    timestamp: admin.firestore.Timestamp.now(),
  });

  // Update session context window
  await sessionRef.update({
    contextWindow: admin.firestore.FieldValue.arrayUnion(messageRef.id),
    messageCount: 1,
  });

  return {
    sessionId: sessionRef.id,
    wordBag,
    firstMessage,
  };
}
