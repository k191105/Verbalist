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
const sessionManager_1 = require("./sessionManager");
const algorithm_1 = require("../srs/algorithm");
// Constants
const SESSION_LIMITS = {
    softWindDownAt: 15,
    hardEndAt: 20,
};
const CONTEXT_WINDOW_SIZE = 10; // Last N messages for LLM context
// Common filler words that indicate minimal effort
const FILLER_WORDS = new Set([
    "ok", "okay", "sure", "yeah", "yes", "no", "yep", "nope", "lol",
    "haha", "idk", "hmm", "mhm", "k", "cool", "nice", "wow", "true",
    "right", "ya", "ye", "nah", "fine", "whatever", "yea", "yup",
]);
/**
 * Classify user engagement level using simple heuristics (no LLM call).
 */
function classifyEngagement(message) {
    const trimmed = message.trim();
    // Gibberish: very short or no real words
    if (trimmed.length < 3)
        return "low_effort";
    // Check if message is just a single filler word
    const lower = trimmed.toLowerCase().replace(/[.!?,]+$/, "");
    if (FILLER_WORDS.has(lower))
        return "low_effort";
    // Gibberish heuristic: count dictionary-like words (3+ letter alpha sequences)
    const words = trimmed.match(/[a-zA-Z]{3,}/g) || [];
    if (words.length === 0)
        return "low_effort";
    // Off-topic heuristic: detect prompt-injection style messages
    const offTopicPatterns = [
        /ignore\s+(your|all|previous)\s+(instructions|prompts)/i,
        /write\s+me\s+(an?\s+)?(essay|story|poem|code|script)/i,
        /you\s+are\s+now\s+/i,
        /pretend\s+(you('re|\s+are)\s+)/i,
        /forget\s+(everything|your\s+instructions)/i,
    ];
    for (const pattern of offTopicPatterns) {
        if (pattern.test(trimmed))
            return "off_topic";
    }
    return "normal";
}
/**
 * Split a long AI response into multiple iMessage-style bubbles.
 * Rules:
 * - Only split ~30% of the time (randomly)
 * - Max 2-3 messages when splitting
 * - Split on natural boundaries: leading interjections with punctuation, trailing questions
 * - Never split mid-word or create fragments
 */
function splitIntoMessages(text) {
    const trimmed = text.trim();
    // Too short to split or randomly don't split (70% chance of no split)
    if (trimmed.length < 80 || Math.random() > 0.3) {
        return [trimmed];
    }
    const parts = [];
    // Pattern 1: leading interjection that ends with punctuation
    // Must be complete phrase with period/exclamation before continuing
    const leadingInterjectionPattern = /^((?:I get that|Totally|Exactly|Hmm|Right|For sure|Fair enough|Oh wow|Oh man|Yeah|True|Honestly|I mean|Interesting|Good point|That's fair|I feel that|Oof|Literally|Real)[.!])\s+(.+)$/is;
    const leadMatch = trimmed.match(leadingInterjectionPattern);
    let remaining = trimmed;
    if (leadMatch && leadMatch[1].length <= 20) { // Ensure interjection is short
        parts.push(leadMatch[1]);
        remaining = leadMatch[2];
    }
    // Pattern 2: trailing question as separate message
    // Only if it's a complete sentence and there's substantial text before it
    const sentences = remaining.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length >= 2) {
        const lastSentence = sentences[sentences.length - 1].trim();
        const beforeLast = sentences.slice(0, -1).join(" ").trim();
        // Only split if:
        // 1. Last sentence is a question
        // 2. Before-last text is substantial (>30 chars)
        // 3. Last sentence is reasonable length (10-80 chars)
        if (lastSentence.endsWith("?") &&
            beforeLast.length > 30 &&
            lastSentence.length > 10 &&
            lastSentence.length < 80) {
            parts.push(beforeLast);
            parts.push(lastSentence);
        }
        else {
            parts.push(remaining);
        }
    }
    else {
        parts.push(remaining);
    }
    // Cap at 3 messages and ensure no empty parts
    const filtered = parts.slice(0, 3).filter((p) => p.trim().length > 5);
    // Fallback: if splitting created invalid results, return original
    if (filtered.length === 0 || filtered.some((p) => p.trim().length < 3)) {
        return [trimmed];
    }
    return filtered;
}
/**
 * Update word bag counts based on LLM-scored usage.
 * Only counts a word as "used" if the score is >= 6 (reasonably correct usage).
 */
function updateWordBagCounts(wordBag, scores) {
    return wordBag.map((item) => {
        const score = scores[item.word];
        if (score !== undefined && score >= 6) {
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
async function sendMessage(db, sessionId, userMessage, retryFromMessageId, authenticatedUserId) {
    var _a, _b, _c, _d, _e;
    // Fetch the session
    const sessionRef = db.collection("chatSessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    if (!sessionDoc.exists) {
        throw new Error(`Session ${sessionId} not found`);
    }
    const session = sessionDoc.data();
    // Validate session ownership
    if (authenticatedUserId && session.userId !== authenticatedUserId) {
        throw new Error("permission-denied: Session does not belong to this user");
    }
    // Check if session is already complete
    if (session.status === "complete") {
        throw new Error("Session is already complete");
    }
    // Idempotency: reject duplicate messages (same content within 5 seconds)
    const recentMsgs = await db
        .collection("messages")
        .where("sessionId", "==", sessionId)
        .where("role", "==", "user")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
    if (!recentMsgs.empty) {
        const lastMsg = recentMsgs.docs[0].data();
        const lastTimestamp = (_c = (_b = (_a = lastMsg.timestamp) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : new Date(0);
        const secondsSinceLast = (Date.now() - lastTimestamp.getTime()) / 1000;
        if (lastMsg.content === userMessage && secondsSinceLast < 5) {
            throw new Error("Duplicate message rejected");
        }
    }
    const personaId = session.personaId;
    const wordBag = session.wordBag;
    const targetWords = wordBag.map((w) => w.word);
    // Calculate new message count (user message + AI response = +2)
    const newMessageCount = session.messageCount + 2;
    // Classify user engagement
    const engagementHint = classifyEngagement(userMessage);
    // Build additional instructions from engagement + wind-down
    let additionalInstructions = "";
    if (engagementHint === "low_effort") {
        additionalInstructions += "\n\nNOTE: The user's last message was very low-effort. Don't mirror the low effort — instead, try harder to be interesting. Ask a more specific or provocative question, share a vivid anecdote, or offer a surprising take. Don't lecture them about engaging more — just be naturally compelling. Still try to weave in target words.";
    }
    else if (engagementHint === "off_topic") {
        additionalInstructions += "\n\nNOTE: The user seems to be going off-topic or trying to derail the conversation. Briefly acknowledge what they said, then smoothly steer back to an interesting topic that's still amenable to using the target words. Don't be preachy about it — just redirect naturally, like a friend who doesn't take the bait.";
    }
    if (newMessageCount >= SESSION_LIMITS.softWindDownAt) {
        additionalInstructions += (0, prompts_1.buildWindDownInstruction)();
    }
    // If retrying, reuse the existing user message doc; otherwise create a new one
    const isRetry = !!retryFromMessageId;
    const userMsgRef = isRetry
        ? db.collection("messages").doc(retryFromMessageId)
        : db.collection("messages").doc();
    // Kick off in parallel: score words, fetch context, and (if not retry) store user message
    const parallelOps = [
        (0, openai_1.scoreWordUsage)(userMessage, targetWords),
        fetchContextMessages(db, sessionId, CONTEXT_WINDOW_SIZE),
    ];
    if (!isRetry) {
        parallelOps.push(userMsgRef.set({
            id: userMsgRef.id,
            sessionId,
            role: "user",
            content: userMessage,
            timestamp: admin.firestore.Timestamp.now(),
            wordUsage: [], // placeholder — updated below
            wordUsageScores: {}, // placeholder — updated below
        }));
    }
    const [wordUsageScores, contextMessages] = await Promise.all(parallelOps);
    const detectedWords = Object.keys(wordUsageScores);
    // Update the user message doc with actual scores (fire-and-forget, non-blocking)
    userMsgRef.update({ wordUsage: detectedWords, wordUsageScores }).catch((e) => console.warn("Non-critical: failed to update word scores on message:", e));
    // Update word bag counts (only counts words scored >= 6)
    const updatedWordBag = updateWordBagCounts(wordBag, wordUsageScores);
    // Update SRS state for each word in the bag (used correctly vs missed opportunity)
    const wordListId = session.wordListId;
    const userId = session.userId;
    const srsResults = await Promise.all(wordBag.map((item) => {
        const score = wordUsageScores[item.word];
        const correctlyUsed = score !== undefined && score >= 6;
        return (0, algorithm_1.updateWordState)(db, userId, wordListId, item.word, correctlyUsed);
    })).catch((e) => {
        console.warn("Non-critical: SRS update failed:", e);
        return [];
    });
    const srsStatesForFrontend = srsResults.map((s) => {
        var _a, _b, _c, _d, _e;
        return ({
            word: s.word,
            bucket: s.bucket,
            reviewCount: s.reviewCount,
            correctUses: s.correctUses,
            confidence: s.confidence,
            lastReviewed: (_e = (_d = (_c = (_b = (_a = s.lastReviewed) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString) === null || _d === void 0 ? void 0 : _d.call(_c)) !== null && _e !== void 0 ? _e : new Date().toISOString(),
        });
    });
    // Add the new user message to context
    contextMessages.push({ role: "user", content: userMessage });
    // Generate AI response — wrapped in try/catch so user message is preserved on failure
    let aiContent;
    try {
        aiContent = await (0, openai_1.generateChatResponse)({
            personaId,
            wordBag: targetWords,
            conversationHistory: contextMessages.map((m) => ({
                ...m,
                role: m.role,
            })),
            additionalInstructions: additionalInstructions || undefined,
        });
    }
    catch (err) {
        console.error("OpenAI API failure:", err);
        // User message is already saved. Return error status without incrementing messageCount.
        return {
            aiMessages: [],
            aiMessage: "",
            sessionStatus: "error",
            updatedWordBag: wordBag, // unchanged
            wordUsageScores,
            messageCount: session.messageCount + 1, // only the user message
            errorType: "ai_unavailable",
            userMessageId: userMsgRef.id,
        };
    }
    // Split AI response into multiple bubble-style messages
    const aiMessages = splitIntoMessages(aiContent);
    // Store AI response in Firestore (full text as one doc for simplicity)
    const aiMsgRef = db.collection("messages").doc();
    await aiMsgRef.set({
        id: aiMsgRef.id,
        sessionId,
        role: "assistant",
        content: aiContent,
        timestamp: admin.firestore.Timestamp.now(),
    });
    // Check if user had exceptional word usage in wind-down zone (reward with extra messages)
    const usedMultipleWords = Object.values(wordUsageScores).filter((s) => s >= 6).length >= 2;
    const isInWindDownZone = newMessageCount >= SESSION_LIMITS.softWindDownAt && newMessageCount < SESSION_LIMITS.hardEndAt;
    const shouldGrantBonusMessage = usedMultipleWords && isInWindDownZone;
    // Determine if session should complete (with bonus message grace)
    let effectiveHardLimit = SESSION_LIMITS.hardEndAt;
    if (shouldGrantBonusMessage) {
        effectiveHardLimit = SESSION_LIMITS.hardEndAt + 2; // Grant up to 2 bonus messages
    }
    const shouldComplete = newMessageCount >= effectiveHardLimit;
    const shouldWindDown = newMessageCount >= SESSION_LIMITS.softWindDownAt && !shouldComplete;
    const newStatus = shouldComplete ? "complete" : "active";
    // On completion: check bonus chat + suggest new words in parallel
    let bonusChatEarned = false;
    let suggestedWords = [];
    if (shouldComplete) {
        const targetWords = updatedWordBag.map((w) => w.word);
        const [bonus, suggestions] = await Promise.all([
            (0, sessionManager_1.checkAndAwardBonusChat)(db, session.userId, updatedWordBag),
            (0, openai_1.suggestRelatedWords)(targetWords).catch(() => []),
        ]);
        bonusChatEarned = bonus;
        // Cross-check against user's existing word list and filter duplicates
        if (suggestions.length > 0) {
            try {
                const userDoc = await db.collection("users").doc(session.userId).get();
                const wordListId = (_d = userDoc.data()) === null || _d === void 0 ? void 0 : _d.activeWordListId;
                if (wordListId) {
                    const wlDoc = await db.collection("wordLists").doc(wordListId).get();
                    const existingWords = new Set((((_e = wlDoc.data()) === null || _e === void 0 ? void 0 : _e.words) || []).map((w) => w.toLowerCase()));
                    const targetSet = new Set(targetWords.map((w) => w.toLowerCase()));
                    suggestedWords = suggestions
                        .filter((w) => !existingWords.has(w.toLowerCase()) && !targetSet.has(w.toLowerCase()))
                        .slice(0, 4);
                }
                else {
                    suggestedWords = suggestions.slice(0, 4);
                }
            }
            catch (_f) {
                suggestedWords = suggestions.slice(0, 4);
            }
        }
        await db.collection("users").doc(session.userId).update({
            lastActiveSessionId: admin.firestore.FieldValue.delete(),
        });
    }
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
        aiMessages,
        aiMessage: aiContent,
        sessionStatus: newStatus,
        updatedWordBag,
        wordUsageScores,
        messageCount: newMessageCount,
        shouldWindDown,
        bonusChatEarned,
        suggestedWords: suggestedWords.length > 0 ? suggestedWords : undefined,
        userMessageId: userMsgRef.id,
        srsStates: srsStatesForFrontend.length > 0 ? srsStatesForFrontend : undefined,
    };
}
//# sourceMappingURL=messageHandler.js.map