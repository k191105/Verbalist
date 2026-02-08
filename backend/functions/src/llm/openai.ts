import OpenAI from "openai";
import { buildSystemPrompt, buildFirstMessagePrompt } from "./prompts";

// Model configuration - centralized for easy modification
export const LLM_MODELS = {
  chat: "gpt-4o-mini",        // Main conversation model
  wordSelection: "gpt-4o-mini", // Word bag selection (cheapest capable)
};

const MAX_TOKENS = 150;

/**
 * Get OpenAI API key from environment variables (Firebase Secrets / params)
 */
function getApiKey(): string {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  throw new Error(
    "OpenAI API key not found. Set Firebase secret OPENAI_API_KEY before deploying."
  );
}

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: getApiKey() });
  }
  return openaiClient;
}

// Types
type PersonaId = "chris" | "gemma" | "eva" | "sid";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GenerateResponseParams {
  personaId: PersonaId;
  wordBag: string[];
  conversationHistory: ChatMessage[];
  additionalInstructions?: string;
}

interface GenerateFirstMessageParams {
  personaId: PersonaId;
  wordBag: string[];
  userName?: string;
}

/**
 * Generate a chat response from the AI persona
 */
export async function generateChatResponse(
  params: GenerateResponseParams
): Promise<string> {
  const { personaId, wordBag, conversationHistory, additionalInstructions } = params;

  let systemPrompt = buildSystemPrompt(personaId, wordBag);
  if (additionalInstructions) {
    systemPrompt += additionalInstructions;
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
  ];

  const client = getClient();
  const response = await client.chat.completions.create({
    model: LLM_MODELS.chat,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: 0.85,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  return content.trim();
}

/**
 * Generate the first message for a new chat session
 */
export async function generateFirstMessage(
  params: GenerateFirstMessageParams
): Promise<string> {
  const { personaId, wordBag, userName } = params;

  const systemPrompt = buildFirstMessagePrompt(personaId, wordBag, userName);

  const client = getClient();
  const response = await client.chat.completions.create({
    model: LLM_MODELS.chat,
    messages: [{ role: "system", content: systemPrompt }],
    max_tokens: MAX_TOKENS,
    temperature: 0.9,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response content from OpenAI");
  }

  return content.trim();
}
