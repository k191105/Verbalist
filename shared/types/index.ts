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
  bonusChatsEarned: number;  // Reset daily, earned by mastering all words
  bonusChatsUsed: number;    // Reset daily, tracks bonus chat usage
  lastActiveSessionId?: string; // For session recovery after app close
  customInstructions?: string;
  preferences: {
    theme: "light" | "dark";
    themeName?: "lapis" | "obsidian" | "porcelain" | "system";
    chatBackground?: string;
    fontSize: "small" | "medium" | "large";
  };
  priorityWords?: string[]; // Words user wants to practice again (for SRS)
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
