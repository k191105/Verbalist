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
exports.sendMessage = sendMessage;
const admin = __importStar(require("firebase-admin"));
const openai_1 = require("../llm/openai");
const prompts_1 = require("../llm/prompts");
// Constants
const SESSION_LIMITS = {
    softWindDownAt: 15,
    hardEndAt: 20,
};
const CONTEXT_WINDOW_SIZE = 10; // Last N messages for LLM context
/**
 * Detect which target words the user used in their message
 */
function detectWordUsage(message, wordBag) {
    const lowerMessage = message.toLowerCase();
    const usedWords = [];
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
function updateWordBagCounts(wordBag, usedWords) {
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
async function fetchContextMessages(db, sessionId, limit) {
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
            role: data.role,
            content: data.content,
        };
    });
    return messages;
}
/**
 * Process an incoming user message and generate AI response
 */
async function sendMessage(db, sessionId, userMessage) {
    // Fetch the session
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
        throw new Error(`Session ${sessionId} not found`);
    }
    const session = sessionDoc.data();
    // Check if session is already complete
    if (session.status === "complete") {
        throw new Error("Session is already complete");
    }
    const personaId = session.personaId;
    const wordBag = session.wordBag;
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
    const contextMessages = await fetchContextMessages(db, sessionId, CONTEXT_WINDOW_SIZE);
    // Add the new user message to context
    contextMessages.push({ role: "user", content: userMessage });
    // Calculate new message count (user message + AI response = +2)
    const newMessageCount = session.messageCount + 2;
    // Build word list for prompt
    const wordList = wordBag.map((w) => w.word);
    // Check if we need wind-down instructions
    const additionalInstructions = newMessageCount >= SESSION_LIMITS.softWindDownAt
        ? (0, prompts_1.buildWindDownInstruction)()
        : undefined;
    // Generate AI response
    const aiContent = await (0, openai_1.generateChatResponse)({
        personaId,
        wordBag: wordList,
        conversationHistory: contextMessages.map((m) => ({
            ...m,
            role: m.role,
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
    const updateData = {
        messageCount: newMessageCount,
        wordBag: updatedWordBag,
        contextWindow: admin.firestore.FieldValue.arrayUnion(userMsgRef.id, aiMsgRef.id),
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
//# sourceMappingURL=messageHandler.js.map