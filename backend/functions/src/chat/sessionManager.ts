import * as admin from "firebase-admin";
import { generateFirstMessage } from "../llm/openai";

// Constants (inlined to avoid cross-directory import issues during build)
const WORD_BAG_SIZE = {
  min: 3,
  max: 5,
};

const CHAT_LIMITS = {
  freeBasePerDay: 1,
  freeMaxPerDay: 3,
  premiumBasePerDay: 5,
  premiumMaxPerDay: 8,
};

// Types (inline to avoid import issues with shared folder during build)
type PersonaId = "chris" | "gemma" | "eva" | "sid";
type SessionStatus = "active" | "complete";
type UserTier = "free" | "premium";

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
  bonusChatEarned?: boolean; // If the previous session earned a bonus chat
}

/**
 * Get today's date string (YYYY-MM-DD) for daily reset comparison
 */
function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Check if user has exceeded daily chat limits
 */
function checkDailyLimit(
  tier: UserTier,
  dailyUsageCount: number,
  bonusChatsEarned: number,
  bonusChatsUsed: number
): boolean {
  const baseLimit = tier === "premium" ? CHAT_LIMITS.premiumBasePerDay : CHAT_LIMITS.freeBasePerDay;
  const availableBonus = bonusChatsEarned - bonusChatsUsed;
  const totalAvailable = baseLimit + availableBonus;
  return dailyUsageCount >= totalAvailable;
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
 * Check if session completion earned a bonus chat (all words mastered)
 * Updates user's bonusChatsEarned if eligible
 */
export async function checkAndAwardBonusChat(
  db: admin.firestore.Firestore,
  userId: string,
  wordBag: WordBagItem[]
): Promise<boolean> {
  // All words must be fully used (currentUseCount >= targetUseCount)
  const allMastered = wordBag.every((w) => w.currentUseCount >= w.targetUseCount);
  
  if (!allMastered || wordBag.length === 0) {
    return false;
  }

  // Fetch user to check current bonus status
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) return false;

  const userData = userDoc.data()!;
  const tier = (userData.tier as UserTier) || "free";
  const bonusChatsEarned = userData.bonusChatsEarned || 0;
  const bonusChatsUsed = userData.bonusChatsUsed || 0;
  const dailyUsageCount = userData.dailyUsageCount || 0;

  const maxBonus = tier === "premium" 
    ? CHAT_LIMITS.premiumMaxPerDay - CHAT_LIMITS.premiumBasePerDay 
    : CHAT_LIMITS.freeMaxPerDay - CHAT_LIMITS.freeBasePerDay;

  const availableBonus = bonusChatsEarned - bonusChatsUsed;

  // Can only earn bonus if:
  // 1. Haven't reached max bonus chats for the day
  // 2. Have used at least the base chats (can't pre-earn bonuses)
  const baseLimit = tier === "premium" ? CHAT_LIMITS.premiumBasePerDay : CHAT_LIMITS.freeBasePerDay;
  
  if (availableBonus < maxBonus && dailyUsageCount >= baseLimit) {
    await db.collection("users").doc(userId).update({
      bonusChatsEarned: admin.firestore.FieldValue.increment(1),
    });
    return true;
  }

  return false;
}
export async function createSession(
  db: admin.firestore.Firestore,
  userId: string,
  personaId: PersonaId,
  wordListId: string
): Promise<CreateSessionResult> {
  // Fetch the user document
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error(`User ${userId} not found`);
  }

  const userData = userDoc.data()!;
  const tier = (userData.tier as UserTier) || "free";
  const today = getTodayDateString();
  const lastResetDate = userData.lastResetDate || "";

  // Reset daily counters if it's a new day
  let dailyUsageCount = userData.dailyUsageCount || 0;
  let bonusChatsEarned = userData.bonusChatsEarned || 0;
  let bonusChatsUsed = userData.bonusChatsUsed || 0;

  if (lastResetDate !== today) {
    dailyUsageCount = 0;
    bonusChatsEarned = 0;
    bonusChatsUsed = 0;
    await db.collection("users").doc(userId).update({
      dailyUsageCount: 0,
      bonusChatsEarned: 0,
      bonusChatsUsed: 0,
      lastResetDate: today,
    });
  }

  // Check daily limits
  if (checkDailyLimit(tier, dailyUsageCount, bonusChatsEarned, bonusChatsUsed)) {
    throw new Error("Daily limit reached");
  }

  // Fetch the word list
  const wordListDoc = await db.collection("wordLists").doc(wordListId).get();

  if (!wordListDoc.exists) {
    throw new Error(`Word list ${wordListId} not found`);
  }

  const wordListData = wordListDoc.data()!;
  
  // Validate word list ownership: must be a template or belong to the user
  if (!wordListData.isTemplate && wordListData.userId !== userId) {
    throw new Error("permission-denied: Word list does not belong to this user");
  }

  const wordList = wordListData as WordList;

  // Handle edge case: empty or very short word lists
  let selectedWords: string[];
  if (wordList.words.length === 0) {
    // Empty word list → no target words, just conversation
    selectedWords = [];
  } else if (wordList.words.length < WORD_BAG_SIZE.min) {
    // Fewer words than minimum → use all available words
    selectedWords = wordList.words;
  } else {
    // Normal case: select random words for the word bag (3-5 words)
    const bagSize =
      Math.floor(Math.random() * (WORD_BAG_SIZE.max - WORD_BAG_SIZE.min + 1)) +
      WORD_BAG_SIZE.min;
    selectedWords = selectRandomWords(wordList.words, bagSize);
  }
  
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

  // Generate first message using OpenAI
  const wordNames = wordBag.map((w) => w.word);
  const firstMessage = await generateFirstMessage({
    personaId,
    wordBag: wordNames,
  });

  // Store the first message
  const messageRef = db.collection("messages").doc();
  await messageRef.set({
    id: messageRef.id,
    sessionId: sessionRef.id,
    role: "assistant",
    content: firstMessage,
    timestamp: admin.firestore.Timestamp.now(),
  });

  // Update session context window and increment usage count
  await sessionRef.update({
    contextWindow: admin.firestore.FieldValue.arrayUnion(messageRef.id),
    messageCount: 1,
  });

  await db.collection("users").doc(userId).update({
    dailyUsageCount: admin.firestore.FieldValue.increment(1),
    lastActiveSessionId: sessionRef.id,
  });

  return {
    sessionId: sessionRef.id,
    wordBag,
    firstMessage,
  };
}
