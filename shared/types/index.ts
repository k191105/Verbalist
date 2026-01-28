export type UserTier = "free" | "premium";
export type PersonaId = "chris" | "gemma" | "eva" | "sid";
export type SessionStatus = "active" | "complete";
export type MessageRole = "user" | "assistant";

export interface User {
  id: string;
  name: string;
  email?: string;
  createdAt: Date;
  activeWordListId: string;
  tier: UserTier;
  dailyUsageCount: number;
  lastResetDate: string;
  customInstructions?: string;
  preferences: {
    theme: "light" | "dark";
    chatBackground?: string;
    fontSize: "small" | "medium" | "large";
  };
  notificationToken?: string;
}

export interface WordList {
  id: string;
  name: string;
  isTemplate: boolean;
  userId?: string;
  createdAt: Date;
  words: string[];
  wordCount: number;
  description?: string;
}

export interface SRSState {
  id: string;
  userId: string;
  wordListId: string;
  word: string;
  bucket: number;
  lastReviewed: Date;
  reviewCount: number;
  correctUses: number;
  confidence: number;
}

export interface WordBagItem {
  word: string;
  targetUseCount: number;
  currentUseCount: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  personaId: PersonaId;
  wordListId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  messageCount: number;
  wordBag: WordBagItem[];
  contextWindow: string[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  wordUsage?: string[];
}

export interface PastChat {
  id: string;
  userId: string;
  personaId: PersonaId;
  completedAt: Date;
  messageCount: number;
  excerpt: string;
  summary?: string;
}
