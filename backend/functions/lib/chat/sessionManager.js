"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAwardBonusChat = checkAndAwardBonusChat;
exports.createSession = createSession;
const admin = __importStar(require("firebase-admin"));
const openai_1 = require("../llm/openai");
const wordBagSelector_1 = require("./wordBagSelector");
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
/**
 * Get today's date string (YYYY-MM-DD) for daily reset comparison
 */
function getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
/**
 * Check if user has exceeded daily chat limits
 */
function checkDailyLimit(tier, dailyUsageCount, bonusChatsEarned, bonusChatsUsed) {
    const baseLimit = tier === "premium" ? CHAT_LIMITS.premiumBasePerDay : CHAT_LIMITS.freeBasePerDay;
    const availableBonus = bonusChatsEarned - bonusChatsUsed;
    const totalAvailable = baseLimit + availableBonus;
    return dailyUsageCount >= totalAvailable;
}
/**
 * Create a word bag with target use counts and optional selection reason
 */
function createWordBag(selected) {
    return selected.map(({ word, reason }) => ({
        word,
        targetUseCount: 1,
        currentUseCount: 0,
        selectionReason: reason,
    }));
}
/**
 * Check if session completion earned a bonus chat (all words mastered)
 * Updates user's bonusChatsEarned if eligible
 */
async function checkAndAwardBonusChat(db, userId, wordBag) {
    // All words must be fully used (currentUseCount >= targetUseCount)
    const allMastered = wordBag.every((w) => w.currentUseCount >= w.targetUseCount);
    if (!allMastered || wordBag.length === 0) {
        return false;
    }
    // Fetch user to check current bonus status
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists)
        return false;
    const userData = userDoc.data();
    const tier = userData.tier || "free";
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
async function createSession(db, userId, personaId, wordListId) {
    // Fetch the user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
    }
    const userData = userDoc.data();
    const tier = userData.tier || "free";
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
    const wordListData = wordListDoc.data();
    // Validate word list ownership: must be a template or belong to the user
    if (!wordListData.isTemplate && wordListData.userId !== userId) {
        throw new Error("permission-denied: Word list does not belong to this user");
    }
    const wordList = wordListData;
    // Fetch user's priority words (for SRS selection)
    const priorityWords = userData.priorityWords || [];
    // Handle edge case: empty or very short word lists
    let selectedWords;
    if (wordList.words.length === 0) {
        selectedWords = [];
    }
    else if (wordList.words.length < WORD_BAG_SIZE.min) {
        selectedWords = wordList.words.map((w) => ({ word: w, reason: "new" }));
    }
    else {
        const bagSize = Math.floor(Math.random() * (WORD_BAG_SIZE.max - WORD_BAG_SIZE.min + 1)) +
            WORD_BAG_SIZE.min;
        const selected = await (0, wordBagSelector_1.selectWordBag)(db, userId, wordListId, wordList.words, bagSize, priorityWords);
        selectedWords = selected;
    }
    const wordBag = createWordBag(selectedWords);
    // Create the session document
    const sessionRef = db.collection("chatSessions").doc();
    const session = {
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
    const firstMessage = await (0, openai_1.generateFirstMessage)({
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
//# sourceMappingURL=sessionManager.js.map