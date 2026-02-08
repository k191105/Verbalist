"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLM_MODELS = void 0;
exports.generateChatResponse = generateChatResponse;
exports.generateFirstMessage = generateFirstMessage;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("./prompts");
// Model configuration - centralized for easy modification
exports.LLM_MODELS = {
    chat: "gpt-4o-mini", // Main conversation model
    wordSelection: "gpt-4o-mini", // Word bag selection (cheapest capable)
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
//# sourceMappingURL=openai.js.map