"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM_MODELS = void 0;
exports.generateChatResponse = generateChatResponse;
exports.generateFirstMessage = generateFirstMessage;
exports.scoreWordUsage = scoreWordUsage;
exports.suggestRelatedWords = suggestRelatedWords;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("./prompts");
// Model configuration - centralized for easy modification
exports.LLM_MODELS = {
    chat: "gpt-4o-mini", // Main conversation model
    wordSelection: "gpt-4o-mini", // Word bag selection (cheapest capable)
    wordUsageScoring: "gpt-4o-mini", // Word usage quality scoring (cheapest)
};
const MAX_TOKENS = 150;
/**
 * Get OpenAI API key from environment variables (Firebase Secrets / params)
 */
function getApiKey() {
    if (process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY;
    }
    throw new Error("OpenAI API key not found. Set Firebase secret OPENAI_API_KEY before deploying.");
}
let openaiClient = null;
function getClient() {
    if (!openaiClient) {
        openaiClient = new openai_1.default({ apiKey: getApiKey() });
    }
    return openaiClient;
}
/**
 * Generate a chat response from the AI persona
 */
async function generateChatResponse(params) {
    var _a, _b;
    const { personaId, wordBag, conversationHistory, additionalInstructions } = params;
    let systemPrompt = (0, prompts_1.buildSystemPrompt)(personaId, wordBag);
    if (additionalInstructions) {
        systemPrompt += additionalInstructions;
    }
    const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
    ];
    const client = getClient();
    const response = await client.chat.completions.create({
        model: exports.LLM_MODELS.chat,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.85,
    });
    const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
    if (!content) {
        throw new Error("No response content from OpenAI");
    }
    return content.trim();
}
/**
 * Generate the first message for a new chat session
 */
async function generateFirstMessage(params) {
    var _a, _b;
    const { personaId, wordBag, userName } = params;
    const systemPrompt = (0, prompts_1.buildFirstMessagePrompt)(personaId, wordBag, userName);
    const client = getClient();
    const response = await client.chat.completions.create({
        model: exports.LLM_MODELS.chat,
        messages: [{ role: "system", content: systemPrompt }],
        max_tokens: MAX_TOKENS,
        temperature: 0.9,
    });
    const content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
    if (!content) {
        throw new Error("No response content from OpenAI");
    }
    return content.trim();
}
/**
 * Quick regex check: does the message contain any form of any target word?
 * Returns the subset of target words that have a possible match.
 * This is a cheap pre-filter so we only call the LLM when there's something to score.
 */
function regexPreCheck(message, targetWords) {
    const lowerMessage = message.toLowerCase();
    return targetWords.filter((word) => {
        const regex = new RegExp(`\\b${word.toLowerCase()}\\w*\\b`);
        return regex.test(lowerMessage);
    });
}
/**
 * Score how well the user used target words in their message.
 * Returns a map of word -> score (1-10), only for words that were attempted.
 * Words not present at all are omitted from the result.
 *
 * Optimization: uses a regex pre-check first. If no target words appear
 * at all, skips the LLM call entirely (returns {}).
 */
async function scoreWordUsage(userMessage, targetWords) {
    var _a, _b, _c;
    // Fast path: regex says no target words are present → skip LLM
    const candidates = regexPreCheck(userMessage, targetWords);
    if (candidates.length === 0) {
        return {};
    }
    // Only ask the LLM about words the regex detected (cheaper prompt)
    const wordList = candidates.join(", ");
    const prompt = `You are a word usage scorer. Given a user's message and a list of target vocabulary words, determine which target words (or close forms like plurals/conjugations) the user attempted to use, and score each on a scale of 1-10 for correctness and naturalness of usage. 1 = completely wrong usage. 10 = perfect, natural usage.

Target words: ${wordList}

User message: "${userMessage}"

Respond ONLY with a JSON object mapping each used word to its score. If a target word was not used at all, omit it. Example: {"eloquent": 8, "pragmatic": 3}
If no target words were used, respond with: {}`;
    const client = getClient();
    const response = await client.chat.completions.create({
        model: exports.LLM_MODELS.wordUsageScoring,
        messages: [{ role: "system", content: prompt }],
        max_tokens: 100,
        temperature: 0,
    });
    const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
    if (!content)
        return {};
    try {
        // Parse the JSON response, handling possible markdown code fences
        const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        // Validate: only keep entries that are candidate words with numeric scores 1-10
        const result = {};
        for (const word of candidates) {
            const lowerWord = word.toLowerCase();
            for (const [key, value] of Object.entries(parsed)) {
                if (key.toLowerCase() === lowerWord &&
                    typeof value === "number" &&
                    value >= 1 &&
                    value <= 10) {
                    result[word] = Math.round(value);
                }
            }
        }
        return result;
    }
    catch (_d) {
        // If LLM returns unparseable response, fall back to empty
        console.warn("Failed to parse word usage scores:", content);
        return {};
    }
}
/**
 * Given the session's target words, suggest 6-8 related sophisticated words.
 * Cheap call: only sends the target words, not the full transcript.
 */
async function suggestRelatedWords(targetWords) {
    var _a, _b, _c;
    const prompt = `You are a vocabulary expansion tool. Given these target vocabulary words: ${targetWords.join(", ")}

Suggest 8 sophisticated English vocabulary words that are thematically or semantically related. Pick words that:
- Are genuinely useful, high-level words (not basic everyday vocabulary)
- Complement the given words in theme, register, or domain
- Are distinct from each other and from the input words

Respond ONLY with a JSON array of lowercase words. No explanation.`;
    const client = getClient();
    try {
        const response = await client.chat.completions.create({
            model: exports.LLM_MODELS.wordUsageScoring,
            messages: [{ role: "system", content: prompt }],
            max_tokens: 60,
            temperature: 0.7,
        });
        const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!content)
            return [];
        const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return parsed.filter((w) => typeof w === "string").slice(0, 8);
        }
        return [];
    }
    catch (_d) {
        console.warn("Failed to suggest related words");
        return [];
    }
}
//# sourceMappingURL=openai.js.map