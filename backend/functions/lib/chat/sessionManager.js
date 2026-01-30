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
exports.createSession = createSession;
const admin = __importStar(require("firebase-admin"));
// Constants (inlined to avoid cross-directory import issues during build)
const WORD_BAG_SIZE = {
    min: 3,
    max: 5,
};
/**
 * Select random words for the word bag (no SRS yet)
 */
function selectRandomWords(words, count) {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}
/**
 * Create a word bag with target use counts
 */
function createWordBag(words) {
    return words.map((word) => ({
        word,
        targetUseCount: 1,
        currentUseCount: 0,
    }));
}
/**
 * Create a new chat session
 */
async function createSession(db, userId, personaId, wordListId) {
    // Fetch the word list
    const wordListDoc = await db.collection("wordLists").doc(wordListId).get();
    if (!wordListDoc.exists) {
        throw new Error(`Word list ${wordListId} not found`);
    }
    const wordList = wordListDoc.data();
    // Select random words for the word bag (3-5 words)
    const bagSize = Math.floor(Math.random() * (WORD_BAG_SIZE.max - WORD_BAG_SIZE.min + 1)) +
        WORD_BAG_SIZE.min;
    const selectedWords = selectRandomWords(wordList.words, bagSize);
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
//# sourceMappingURL=sessionManager.js.map